import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function PanelCoordinador({ onBack }) {
  const [incidentes, setIncidentes] = useState([]);

  useEffect(() => {
    // Escuchar cambios en tiempo real
    const q = query(collection(db, "incidentes"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setIncidentes(lista);
    });
    return () => unsub();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "incidentes", id), { estado: nuevoEstado });
    } catch (err) {
      alert("Error al actualizar");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#2c5f2d", margin: 0 }}>👮 Panel de Coordinador</h2>
        <button onClick={onBack} style={{ padding: "8px 15px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          ← Salir
        </button>
      </div>

      {incidentes.length === 0 ? <p>Cargando reportes...</p> : (
        incidentes.map((inc) => (
          <div key={inc.id} style={{ 
            background: "#fff", padding: "15px", marginBottom: "10px", borderRadius: "8px", 
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)", borderLeft: `5px solid ${inc.estado === 'pendiente' ? '#ffc107' : inc.estado === 'verificado' ? '#17a2b8' : '#28a745'}` 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <strong style={{ textTransform: "capitalize" }}>{inc.tipo}</strong>
              <span style={{ fontSize: "12px", color: "#888" }}>Reportado por: {inc.nombreUsuario}</span>
            </div>
            <p style={{ margin: "5px 0", color: "#333" }}>{inc.descripcion}</p>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
               Lat: {inc.lat} | Lon: {inc.lon} | Estado: <strong style={{ textTransform: "uppercase" }}>{inc.estado}</strong>
            </p>
            
            <div style={{ display: "flex", gap: "10px" }}>
              {inc.estado !== "verificado" && (
                <button onClick={() => cambiarEstado(inc.id, "verificado")} style={{ flex: 1, padding: "8px", background: "#17a2b8", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                  ✅ Verificar
                </button>
              )}
              {inc.estado !== "resuelto" && (
                <button onClick={() => cambiarEstado(inc.id, "resuelto")} style={{ flex: 1, padding: "8px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                  ✔️ Resolver
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}