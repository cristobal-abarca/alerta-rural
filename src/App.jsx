import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Reporte from "./pages/Reporte";
import PanelCoordinador from "./pages/PanelCoordinador";

function App() {
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState("seleccion");
  const [perfil, setPerfil] = useState(null);
  const [alertaActiva, setAlertaActiva] = useState(false);
  const [showEmergencias, setShowEmergencias] = useState(false); // Nuevo estado para el menú

  // Control de autenticación
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && (vista === "login" || vista === "registro" || vista === "seleccion")) {
        if (perfil === 'coordinador') setVista("coordinador");
        else setVista("reporte");
      }
    });
    return () => unsub();
  }, [perfil, vista]);

  // Alertas en tiempo real
  useEffect(() => {
    const q = query(collection(db, "alertas_urgentes"), orderBy("fecha", "desc"), limit(1));
    const unsubAlert = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const alerta = snapshot.docs[0].data();
        const fechaAlerta = alerta.fecha?.toDate();
        const ahora = new Date();
        const diferencia = fechaAlerta ? (ahora - fechaAlerta) / 1000 : 999;
        
        if (alerta.tipo === "pánico" && diferencia < 15) {
          setAlertaActiva(true);
          setTimeout(() => setAlertaActiva(false), 10000);
        }
      }
    });
    return () => unsubAlert();
  }, []);

  // Pantalla de emergencia global
  if (alertaActiva) {
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "#dc3545", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
        <h1 style={{ fontSize: "60px", margin: 0 }}>🚨🚨</h1>
        <h2 style={{ fontSize: "40px", margin: "20px 0" }}>ALERTA MÁXIMA</h2>
        <p style={{ fontSize: "20px", marginBottom: "30px" }}>EMERGENCIA EN LA COMUNIDAD</p>
        <button onClick={() => setAlertaActiva(false)} style={{ padding: "15px 30px", fontSize: "20px", cursor: "pointer", background: "white", color: "red", border: "none", borderRadius: "10px", fontWeight: "bold" }}>
          ✓ Entendido
        </button>
      </div>
    );
  }

  // Funciones de navegación
  const handleUsuarioClick = () => { setPerfil('residente'); setVista('login'); };
  const handleAdminClick = () => { setPerfil('coordinador'); setVista('login'); };
  const handleLogout = () => { auth.signOut(); setVista("seleccion"); setPerfil(null); };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f4f6f5", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* PANTALLA DE SELECCIÓN */}
      {vista === "seleccion" && (
        <div style={{ textAlign: "center", marginTop: "8vh", maxWidth: "500px", width: "100%", padding: "20px" }}>
          <h1 style={{ color: "#2c5f2d", fontSize: "36px", marginBottom: "10px", fontWeight: "bold" }}>🚨 Alerta Rural</h1>
          <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>Sistema de Emergencias Comunitarias</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", marginBottom: "25px" }}>
            <button type="button" onClick={handleUsuarioClick} style={{ width: "100%", maxWidth: "400px", padding: "22px", fontSize: "18px", background: "#2c5f2d", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 12px rgba(44, 95, 45, 0.3)", fontWeight: "600" }}>
              👤 Entrar como Usuario
            </button>
            <button type="button" onClick={handleAdminClick} style={{ width: "100%", maxWidth: "400px", padding: "22px", fontSize: "18px", background: "#343a40", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 12px rgba(52, 58, 64, 0.3)", fontWeight: "600" }}>
              👮 Entrar como Administrador
            </button>
          </div>

          {/* 📞 BOTÓN PARA VER NÚMEROS DE EMERGENCIA */}
          <button 
            type="button" 
            onClick={() => setShowEmergencias(true)}
            style={{ 
              width: "100%", 
              maxWidth: "400px", 
              padding: "14px", 
              fontSize: "16px", 
              background: "transparent", 
              color: "#dc3545", 
              border: "2px solid #dc3545", 
              borderRadius: "10px", 
              cursor: "pointer", 
              fontWeight: "600",
              marginBottom: "15px"
            }}
          >
             Ver Números de Emergencia (Chile)
          </button>
          <p style={{ fontSize: "12px", color: "#888" }}>Selecciona tu perfil para acceder al sistema</p>
        </div>
      )}

      {/* LOGIN & REGISTRO */}
      {vista === "login" && <Login onSwitch={() => setVista("registro")} />}
      {vista === "registro" && <Registro onBack={() => setVista("login")} />}

      {/* REPORTE */}
      {vista === "reporte" && (
        <Reporte
          user={user}
          onLogout={handleLogout}
          onGoToPanel={() => { setPerfil('coordinador'); setVista("coordinador"); }}
        />
      )}

      {/* PANEL COORDINADOR */}
      {vista === "coordinador" && (
        <PanelCoordinador onBack={() => setVista("reporte")} />
      )}

      {/* 📞 MODAL DE EMERGENCIAS */}
      {showEmergencias && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, 
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" 
        }}>
          <div style={{ 
            background: "white", borderRadius: "16px", padding: "25px", maxWidth: "400px", width: "100%", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)", position: "relative" 
          }}>
            <button 
              onClick={() => setShowEmergencias(false)}
              style={{ position: "absolute", top: "10px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}
            >
              ✕
            </button>
            <h2 style={{ color: "#dc3545", margin: "0 0 20px 0", textAlign: "center", fontSize: "22px" }}>📞 Emergencias Chile</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { name: "🚔 Carabineros", num: "133" },
                { name: "🚒 Bomberos", num: "132" },
                { name: " Ambulancia (SAMU)", num: "131" },
                { name: "️ PDI (Investigaciones)", num: "134" },
                { name: "🌲 CONAF (Incendios Forestales)", num: "130" },
                { name: " Cruz Roja", num: "135" }
              ].map((item, idx) => (
                <a 
                  key={idx} 
                  href={`tel:${item.num}`}
                  style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center", 
                    padding: "12px 15px", background: "#f8f9fa", borderRadius: "8px", 
                    textDecoration: "none", color: "#333", fontWeight: "500", border: "1px solid #e9ecef" 
                  }}
                >
                  <span>{item.name}</span>
                  <span style={{ background: "#dc3545", color: "white", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", fontSize: "15px" }}>
                    {item.num}
                  </span>
                </a>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "#777", textAlign: "center", marginTop: "15px" }}>
              Toca un número para llamar directamente desde tu celular.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;