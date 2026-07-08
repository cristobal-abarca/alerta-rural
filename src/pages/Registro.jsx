import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Registro({ onBack }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: nombre });
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre,
        email,
        rol: "residente",
        zona: 1,
        creado: new Date()
      });
      alert("✅ Cuenta creada. Inicia sesión.");
      onBack();
    } catch (err) {
      setError("Email ya existe o contraseña débil (mín 6 caracteres)");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "30px", background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#2c5f2d", textAlign: "center", marginBottom: "20px" }}>📝 Registro</h2>
      {error && <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginBottom: "15px", textAlign: "center" }}>{error}</div>}
      <form onSubmit={handleRegister}>
        <input 
          placeholder="Nombre completo" 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          style={{ width: "100%", padding: "12px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px" }} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: "100%", padding: "12px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px" }} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={pass} 
          onChange={(e) => setPass(e.target.value)} 
          style={{ width: "100%", padding: "12px", marginBottom: "20px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px" }} 
          required 
        />
        <button 
          type="submit" 
          style={{ width: "100%", padding: "14px", background: "#2c5f2d", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
        >
          Crear cuenta
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "20px", color: "#2c5f2d", cursor: "pointer", fontSize: "14px" }} onClick={onBack}>
        ← <strong>Volver al login</strong>
      </p>
    </div>
  );
}