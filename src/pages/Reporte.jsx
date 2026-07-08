import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function Reporte({ user, onLogout, onGoToPanel }) {
  const [tipo, setTipo] = useState("robo");
  const [desc, setDesc] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cargandoDir, setCargandoDir] = useState(false);
  const [msg, setMsg] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  
  // Usamos Refs para acceder al estado dentro de los eventos de voz
  const reconocimientoRef = useRef(null);
  const escuchandoRef = useRef(false);

  // Sincronizar el ref con el estado
  useEffect(() => {
    escuchandoRef.current = escuchando;
  }, [escuchando]);

  // 🎵 Función para generar sonido de Sirena
  const reproducirSirena = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    // Reanudar contexto si está suspendido (política de navegadores móviles)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(1000, now + 0.5);
    osc.frequency.linearRampToValueAtTime(400, now + 1.0);
    osc.frequency.linearRampToValueAtTime(1000, now + 1.5);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 2);

    osc.start(now);
    osc.stop(now + 2.5);
  };

  // 🌍 Obtener Dirección desde Coordenadas
  const obtenerDireccion = async (latitude, longitude) => {
    setCargandoDir(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const calle = addr.road || addr.pedestrian || addr.suburb || '';
        const localidad = addr.neighbourhood || addr.suburb || addr.village || '';
        const comuna = addr.city || addr.town || addr.municipality || addr.county || '';
        
        let dirCompleta = "";
        if (calle) dirCompleta += calle + ", ";
        if (localidad) dirCompleta += localidad + ", ";
        if (comuna) dirCompleta += comuna;
        
        setDireccion(dirCompleta || data.display_name || "Ubicación desconocida");
      } else {
        setDireccion("Dirección no encontrada");
      }
    } catch (error) {
      console.error("Error dirección:", error);
      setDireccion("Error al obtener dirección");
    } finally {
      setCargandoDir(false);
    }
  };

  // 🎤 Configurar Reconocimiento de Voz (Se ejecuta una vez al cargar)
  useEffect(() => {
    // Verificar soporte del navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Reconocimiento de voz no soportado en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase();
      console.log("Escuchado:", transcript);

      const palabrasEmergencia = ['ayuda', 'socorro', 'emergencia', 'pánico', 'auxilio', 'policia', 'bomberos', 'robo', 'incendio'];
      const palabraDetectada = palabrasEmergencia.find(palabra => transcript.includes(palabra));
      
      if (palabraDetectada && escuchandoRef.current) {
        setMsg(`🎤 Detectado: "${palabraDetectada}" - Activando alerta...`);
        enviarPanicButton();
      }
    };

    recognition.onerror = (event) => {
      console.error("Error voz:", event.error);
      // Mostrar alerta solo si NO es "no-speech" (silencio normal)
      if (event.error !== 'no-speech') {
        alert(`❌ Error de Micrófono: ${event.error}\n\nPosible causa: Permisos denegados o no es HTTPS.`);
      }
      // Si se detiene inesperadamente pero seguimos "escuchando", intentar reiniciar
      if (escuchandoRef.current && event.error === 'not-allowed') {
         setEscuchando(false);
         alert("Permiso de micrófono denegado. Revíselo en la configuración del sitio.");
      }
    };

    recognition.onend = () => {
      // Si el usuario sigue queriendo escuchar, reiniciar automáticamente
      if (escuchandoRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Intento de reinicio fallido");
        }
      }
    };

    reconocimientoRef.current = recognition;
  }, []);

  const getUbicacion = () => {
    if (!navigator.geolocation) return setMsg("❌ Geolocalización no disponible");
    setMsg("📍 Obteniendo ubicación...");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const latVal = p.coords.latitude.toFixed(6);
        const lonVal = p.coords.longitude.toFixed(6);
        setLat(latVal);
        setLon(lonVal);
        obtenerDireccion(latVal, lonVal);
        setMsg("✅ Ubicación obtenida");
      },
      () => setMsg("❌ Permite la ubicación en tu navegador")
    );
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!lat || !lon || !desc) return setMsg(" Completa todos los campos y obtén ubicación");
    
    try {
      await addDoc(collection(db, "incidentes"), {
        usuarioId: user.uid,
        nombreUsuario: user.displayName || "Vecino",
        tipo,
        descripcion: desc,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        direccion: direccion || "Sin dirección",
        estado: "pendiente",
        fecha: serverTimestamp()
      });
      setMsg("✅ Reporte enviado correctamente");
      setDesc("");
      setLat("");
      setLon("");
      setDireccion("");
    } catch (err) {
      setMsg("❌ Error al enviar. Verifica tu conexión.");
    }
  };

  // 🚨 FUNCIÓN DEL BOTÓN DE PÁNICO
  const enviarPanicButton = async () => {
    reproducirSirena();

    try {
      await addDoc(collection(db, "alertas_urgentes"), {
        mensaje: "🚨 ALERTA DE EMERGENCIA MASIVA",
        usuario: user.displayName || "Vecino",
        userId: user.uid,
        fecha: serverTimestamp(),
        tipo: "pánico",
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null,
        direccion: direccion || "Ubicación no definida",
        activadoPor: "manual"
      });
      setMsg("🚨 ALERTA ENVIADA A TODA LA COMUNIDAD");
      setTimeout(() => setMsg(""), 5000);
    } catch (error) {
      console.error("Error enviando alerta:", error);
      setMsg("❌ Error al enviar la alerta");
    }
  };

  // 🎤 Activar/desactivar escucha de voz
  const toggleEscuchaVoz = () => {
    if (!reconocimientoRef.current) {
      alert("❌ Tu navegador no soporta reconocimiento de voz. Usa Chrome en Android.");
      return;
    }

    // Verificar contexto seguro (HTTPS)
    if (!window.isSecureContext) {
      alert("⚠️ La voz requiere HTTPS. Asegúrate de usar el link https://...web.app");
      return;
    }

    if (escuchando) {
      reconocimientoRef.current.stop();
      setEscuchando(false);
      setMsg(" Escucha detenida");
    } else {
      // Intentar iniciar
      try {
        reconocimientoRef.current.start();
        setEscuchando(true);
        setMsg("🎤 ESCUCHA ACTIVA: Di 'AYUDA' o 'EMERGENCIA'");
      } catch (error) {
        console.error(error);
        alert("No se pudo iniciar el micrófono. Revisa los permisos en el candado de la barra de direcciones.");
      }
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "30px auto", padding: "30px", background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#2c5f2d", margin: "0 0 10px 0" }}>🚨 Nuevo Reporte</h2>
        <p style={{ margin: 0, color: "#666" }}>Hola, <strong>{user.displayName || user.email}</strong></p>
      </div>
      
      {msg && (
        <div style={{ 
          padding: "15px", 
          borderRadius: "8px", 
          marginBottom: "20px", 
          textAlign: "center",
          background: msg.includes("✅") ? "#d4edda" : msg.includes("🚨") ? "#f8d7da" : msg.includes("🎤") ? "#fff3cd" : msg.includes("📍") ? "#d1ecf1" : "#f8d7da", 
          color: msg.includes("✅") ? "#155724" : msg.includes("🚨") ? "#721c24" : msg.includes("") ? "#856404" : msg.includes("📍") ? "#0c5460" : "#721c24",
          fontSize: "16px",
          fontWeight: msg.includes("") || msg.includes("🎤") ? "bold" : "normal"
        }}>
          {msg}
        </div>
      )}

      {/* 🎤 BOTÓN DE ACTIVACIÓN POR VOZ */}
      <div style={{ 
        padding: "20px", 
        background: escuchando ? "#fff3cd" : "#f8f9fa", 
        borderRadius: "10px", 
        marginBottom: "20px",
        border: escuchando ? "2px solid #ffc107" : "2px solid #dee2e6"
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>🎤 Activación por Voz</h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
          Di: <strong>"ayuda", "socorro", "emergencia"</strong>
        </p>
        <button
          type="button"
          onClick={toggleEscuchaVoz}
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "16px",
            fontWeight: "bold",
            background: escuchando ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: escuchando ? "0 0 15px rgba(220, 53, 69, 0.5)" : "0 2px 8px rgba(40, 167, 69, 0.3)",
            animation: escuchando ? "pulse 1.5s infinite" : "none"
          }}
        >
          {escuchando ? "🔴 DETENER ESCUCHA" : "🟢 ACTIVAR ESCUCHA"}
        </button>
        {escuchando && (
          <p style={{ fontSize: "12px", color: "#856404", marginTop: "10px", textAlign: "center" }}>
            👂 Escuchando... di una palabra de emergencia
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>

      <form onSubmit={enviar}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>Tipo de incidente:</label>
        <select 
          value={tipo} 
          onChange={(e) => setTipo(e.target.value)} 
          style={{ width: "100%", padding: "12px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px" }}
        >
          <option value="robo">🔒 Robo/Intrusión</option>
          <option value="incendio">🔥 Incendio</option>
          <option value="accidente"> Accidente</option>
          <option value="deslizamiento">⛰️ Deslizamiento</option>
          <option value="emergencia_medica">🚑 Emergencia Médica</option>
          <option value="otro"> Otro</option>
        </select>

        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>Descripción:</label>
        <textarea 
          placeholder="Describe lo ocurrido..." 
          value={desc} 
          onChange={(e) => setDesc(e.target.value)} 
          rows="3" 
          style={{ width: "100%", padding: "12px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px", resize: "vertical" }} 
          required 
        />

        <button 
          type="button" 
          onClick={getUbicacion} 
          style={{ width: "100%", padding: "12px", background: "#17a2b8", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginBottom: "15px" }}
        >
          📍 Obtener mi ubicación
        </button>

        {/*  CAMPO DE DIRECCIÓN LEGIBLE */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>Ubicación Detectada:</label>
          <div style={{ 
            padding: "12px", 
            background: "#f8f9fa", 
            borderRadius: "8px", 
            border: "1px solid #ddd",
            minHeight: "45px",
            display: "flex",
            alignItems: "center",
            color: direccion ? "#333" : "#999",
            fontSize: "15px"
          }}>
            {cargandoDir ? "🔄 Buscando dirección..." : (direccion || "Presiona 'Obtener ubicación' primero")}
          </div>
        </div>

        <button 
          type="submit" 
          style={{ width: "100%", padding: "14px", background: "#2c5f2d", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" }}
        >
           Enviar Reporte
        </button>
      </form>

      {/* 🚨 BOTÓN DE PÁNICO / EMERGENCIA */}
      <div style={{ marginTop: "30px", borderTop: "3px dashed #dc3545", paddingTop: "25px", textAlign: "center" }}>
        <p style={{ fontSize: "14px", color: "#dc3545", fontWeight: "bold", marginBottom: "15px" }}>
          ⚠️ ZONA DE EMERGENCIA
        </p>
        <button 
          type="button" 
          onClick={enviarPanicButton}
          style={{
            width: "100%",
            padding: "25px",
            fontSize: "22px",
            fontWeight: "bold",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "0 6px 15px rgba(220, 53, 69, 0.5)",
            transition: "all 0.3s",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
        >
           BOTÓN DE PÁNICO 🚨
        </button>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
          O activa con tu voz usando el botón verde de arriba
        </p>
      </div>

      {/* 👮 BOTÓN PARA IR AL PANEL DE COORDINADOR */}
      <button 
        onClick={() => { if (typeof onGoToPanel === 'function') onGoToPanel(); }} 
        style={{ 
          width: "100%", 
          padding: "12px", 
          marginTop: "20px", 
          background: "#343a40", 
          color: "white", 
          border: "none", 
          borderRadius: "8px", 
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: "600"
        }}
      >
        👮 Ir a Panel de Coordinador
      </button>

      {/*  CERRAR SESIÓN */}
      <button 
        onClick={onLogout} 
        style={{ width: "100%", padding: "12px", background: "#6c757d", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", marginTop: "10px", cursor: "pointer" }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}