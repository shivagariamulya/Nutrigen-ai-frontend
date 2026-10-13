import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const RAW_API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API = RAW_API_URL.endsWith("/api")
    ? RAW_API_URL.replace(/\/+$/, "")
    : `${RAW_API_URL.replace(/\/+$/, "")}/api`;

function App() {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("nutrigenUser") || "null")
    );

    const [page, setPage] = useState("dashboard");

    if (!user) {
        return (
            <Login
                onLogin={(u) => {
                    localStorage.setItem("nutrigenUser", JSON.stringify(u));
                    setUser(u);
                }}
            />
        );
    }

    return (
        <div className="app">
            <aside>
                <h1>🥗 NutriGen</h1>

                <button
                    className={page === "dashboard" ? "active" : ""}
                    onClick={() => setPage("dashboard")}
                >
                    📊 Dashboard
                </button>

                <button
                    className={page === "analyze" ? "active" : ""}
                    onClick={() => setPage("analyze")}
                >
                    📸 Analyze Meal
                </button>

                <button
                    className={page === "plan" ? "active" : ""}
                    onClick={() => setPage("plan")}
                >
                    🥗 AI Diet Plan
                </button>

                <button
                    className={page === "reports" ? "active" : ""}
                    onClick={() => setPage("reports")}
                >
                    📈 Analytics & Reports
                </button>

                <button
                    className={page === "history" ? "active" : ""}
                    onClick={() => setPage("history")}
                >
                    🕒 Meal History
                </button>

                <button
                    className={page === "profile" ? "active" : ""}
                    onClick={() => setPage("profile")}
                >
                    👤 Profile
                </button>

                <button
                    className="logout-btn"
                    onClick={() => {
                        localStorage.clear();
                        setUser(null);
                    }}
                >
                    🚪 Logout
                </button>
            </aside>

            <main>
                <header>
                    <h2>
                        {page === "dashboard"
                            ? "Nutrition Dashboard"
                            : page === "analyze"
                                ? "AI Food Analysis"
                                : page === "plan"
                                    ? "Tailored AI Diet Plan"
                                    : page === "reports"
                                        ? "Nutrition Analytics & Reports"
                                        : page === "history"
                                            ? "Meal History"
                                            : "My Nutrition Profile"}
                    </h2>

                    <span className="user-greeting">Hi, {user.name} 👋</span>
                </header>

                {page === "dashboard" ? (
                    <Dashboard user={user} setPage={setPage} />
                ) : page === "analyze" ? (
                    <Analyze user={user} />
                ) : page === "plan" ? (
                    <DietPlan user={user} setPage={setPage} />
                ) : page === "reports" ? (
                    <Reports user={user} />
                ) : page === "history" ? (
                    <History user={user} />
                ) : (
                    <Profile
                        user={user}
                        onProfileUpdated={(updated) => {
                            const merged = { ...user, ...updated };
                            localStorage.setItem("nutrigenUser", JSON.stringify(merged));
                            setUser(merged);
                        }}
                    />
                )}
            </main>
        </div>
    );
}


// ==================== LOGIN / REGISTER ====================

function Login({ onLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [reg, setReg] = useState(false);
    const [loading, setLoading] = useState(false);

    async function go() {
        if (!email.trim() || !pw.trim()) {
            alert("Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                API + "/auth/" + (reg ? "register" : "login"),
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        reg
                            ? { name: name.trim() || "User", email: email.trim(), password: pw }
                            : { email: email.trim(), password: pw }
                    )
                }
            );

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid response from server: " + text.slice(0, 100));
            }

            if (response.ok) {
                onLogin(data);
            } else {
                alert(data?.message || "Authentication failed.");
            }
        } catch (error) {
            console.error(error);
            alert("Unable to connect to backend: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login">
            <div className="card">
                <h1 style={{ margin: "0 0 8px", color: "#173d2b" }}>🥗 NutriGen</h1>
                <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "14px" }}>
                    AI-powered food analysis & personalized nutrition
                </p>

                {reg && (
                    <input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                )}

                <input
                    placeholder="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    placeholder="Password"
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                />

                <button disabled={loading} onClick={go}>
                    {loading ? "Processing..." : reg ? "Create Account" : "Login"}
                </button>

                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setReg(!reg);
                    }}
                >
                    {reg
                        ? "Already have an account? Login"
                        : "New to NutriGen? Create an account"}
                </a>
            </div>
        </div>
    );
}


// ==================== DASHBOARD ====================

function Dashboard({ user, setPage }) {
    const [summary, setSummary] = useState(null);
    const [profile, setProfile] = useState(user);

    useEffect(() => {
        fetch(API + "/users/" + user.id)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data && !data.message) setProfile(data);
            })
            .catch(() => {});

        fetch(API + "/meals/summary/" + user.id + "?days=1")
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (data && !data.message) setSummary(data);
            })
            .catch((error) => console.error(error));
    }, [user.id]);

    const calories = summary?.calories || 0;
    const protein = summary?.protein || 0;
    const carbs = summary?.carbohydrates || 0;
    const fat = summary?.fats || 0;

    const targetCal = profile?.dailyCalories || 2000;
    const targetProt = profile?.dailyProtein || 100;
    const targetCarbs = profile?.dailyCarbs || 250;
    const targetFat = profile?.dailyFat || 65;

    const calPercent = Math.min(100, Math.round((calories / targetCal) * 100));

    return (
        <section>
            <div className="grid">
                <Stat
                    title="Calories consumed"
                    value={Math.round(calories)}
                    unit="kcal"
                    target={Math.round(targetCal)}
                    color="#2d8a59"
                />

                <Stat
                    title="Protein consumed"
                    value={Math.round(protein)}
                    unit="g"
                    target={Math.round(targetProt)}
                    color="#10b981"
                />

                <Stat
                    title="Carbs consumed"
                    value={Math.round(carbs)}
                    unit="g"
                    target={Math.round(targetCarbs)}
                    color="#3b82f6"
                />

                <Stat
                    title="Fat consumed"
                    value={Math.round(fat)}
                    unit="g"
                    target={Math.round(targetFat)}
                    color="#f59e0b"
                />
            </div>

            {/* Daily Calorie Goal Progress Card */}
            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                        <h3 style={{ margin: "0 0 4px" }}>Today's Calorie Budget</h3>
                        <span style={{ fontSize: "14px", color: "#64748b" }}>
                            {Math.round(calories)} of {Math.round(targetCal)} kcal ({calPercent}%)
                        </span>
                    </div>
                    <span className={`badge ${calories > targetCal ? "badge-red" : "badge-green"}`}>
                        {calories > targetCal ? "Exceeded Budget" : `${Math.round(targetCal - calories)} kcal left`}
                    </span>
                </div>

                <div style={{ height: "12px", width: "100%", background: "#e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                    <div
                        style={{
                            height: "100%",
                            width: `${calPercent}%`,
                            background: calories > targetCal ? "#ef4444" : "linear-gradient(90deg, #10b981, #2d8a59)",
                            borderRadius: "8px",
                            transition: "width 0.4s ease"
                        }}
                    ></div>
                </div>
            </div>

            {/* Quick Navigation Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
                <div className="card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📸</div>
                    <h3 style={{ margin: "0 0 6px", color: "#166534" }}>Analyze Food Photo</h3>
                    <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "14px" }}>
                        Upload meal photos for instant AI identification, calorie, and macro estimation.
                    </p>
                    <button onClick={() => setPage("analyze")} style={{ margin: 0 }}>
                        Upload Food Photo
                    </button>
                </div>

                <div className="card" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)", border: "1px solid #bfdbfe" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🥗</div>
                    <h3 style={{ margin: "0 0 6px", color: "#1e40af" }}>View AI Diet Plan</h3>
                    <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "14px" }}>
                        Get smart meals tailored to your remaining calorie budget, goal, and metabolic burn.
                    </p>
                    <button onClick={() => setPage("plan")} style={{ background: "#2563eb", margin: 0 }}>
                        Open Today's Diet Plan
                    </button>
                </div>

                <div className="card" style={{ background: "linear-gradient(135deg, #fefce8 0%, #ffffff 100%)", border: "1px solid #fef08a" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📈</div>
                    <h3 style={{ margin: "0 0 6px", color: "#854d0e" }}>Analytics & Reports</h3>
                    <p style={{ margin: "0 0 16px", color: "#475569", fontSize: "14px" }}>
                        Review weekly and monthly trends, calories burned (TDEE), and export reports.
                    </p>
                    <button onClick={() => setPage("reports")} style={{ background: "#ca8a04", margin: 0 }}>
                        View Nutrition Reports
                    </button>
                </div>
            </div>
        </section>
    );
}

function Stat({ title, value, unit, target, color }) {
    return (
        <div className="stat">
            <span>{title}</span>
            <strong style={color ? { color } : {}}>
                {value} {unit}
            </strong>
            {target && (
                <small>
                    Target: {target} {unit}
                </small>
            )}
        </div>
    );
}


// ==================== ANALYZE FOOD MEAL ====================

function Analyze({ user }) {
    const [items, setItems] = useState([]);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [portion, setPortion] = useState("1 standard serving");

    function handleFilesChange(e) {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        setErrorMsg("");
        const newItems = selectedFiles.map((file, idx) => ({
            id: Date.now() + "_" + idx + "_" + Math.random().toString(36).substring(2, 6),
            file: file,
            preview: URL.createObjectURL(file),
            result: null,
            loading: false,
            error: null,
            saved: false
        }));

        setItems((prev) => [...prev, ...newItems]);
        e.target.value = "";
    }

    function removeItem(idToRemove) {
        setItems((prev) => prev.filter((item) => item.id !== idToRemove));
    }

    function clearAll() {
        setItems([]);
        setErrorMsg("");
    }

    async function analyzeItem(item) {
        try {
            setItems((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, loading: true, error: null } : it))
            );

            const formData = new FormData();
            formData.append("userId", user.id);
            formData.append("image", item.file);
            if (portion) {
                formData.append("portion", portion);
            }

            const response = await fetch(API + "/analysis/upload-meal", {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                throw new Error("Server returned invalid response (" + response.status + ")");
            }

            if (!response.ok) {
                throw new Error(data?.message || "Analysis failed");
            }

            setItems((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, loading: false, result: data } : it))
            );
        } catch (err) {
            setItems((prev) =>
                prev.map((it) =>
                    it.id === item.id
                        ? { ...it, loading: false, error: err.message || "Failed to analyze" }
                        : it
                )
            );
        }
    }

    async function analyzeAll() {
        if (items.length === 0) {
            setErrorMsg("Please select at least one photo to analyze.");
            return;
        }

        setGlobalLoading(true);
        setErrorMsg("");

        for (const item of items) {
            if (!item.result) {
                await analyzeItem(item);
            }
        }

        setGlobalLoading(false);
    }

    async function saveMeal(item) {
        if (!item.result || item.saved) return;

        try {
            const meal = {
                userId: user.id,
                foodName: item.result.mealName,
                portion: item.result.portion || "1 standard serving",
                imageName: item.file?.name || "",
                calories: item.result.calories,
                protein: item.result.protein,
                carbohydrates: item.result.carbohydrates,
                fats: item.result.fats
            };

            const response = await fetch(API + "/meals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(meal)
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                throw new Error("Server returned invalid response (" + response.status + ")");
            }

            if (!response.ok) {
                throw new Error(data?.message || "Failed to save meal");
            }

            setItems((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, saved: true } : it))
            );
        } catch (err) {
            alert("Unable to save meal: " + err.message);
        }
    }

    async function saveAllAnalyzed() {
        const unsaved = items.filter((it) => it.result && !it.saved);
        if (unsaved.length === 0) return;

        try {
            const batch = unsaved.map((it) => ({
                userId: user.id,
                foodName: it.result.mealName,
                portion: it.result.portion || "1 standard serving",
                imageName: it.file?.name || "",
                calories: it.result.calories,
                protein: it.result.protein,
                carbohydrates: it.result.carbohydrates,
                fats: it.result.fats
            }));

            const response = await fetch(API + "/meals/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(batch)
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                throw new Error("Server returned invalid response (" + response.status + ")");
            }

            if (!response.ok) {
                throw new Error(data?.message || "Failed to save all meals");
            }

            setItems((prev) =>
                prev.map((it) => (it.result ? { ...it, saved: true } : it))
            );
            alert("All " + unsaved.length + " meals saved successfully!");
        } catch (err) {
            alert("Error saving meals: " + err.message);
        }
    }

    const analyzedCount = items.filter((it) => it.result).length;
    const unsavedCount = items.filter((it) => it.result && !it.saved).length;

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                    <h3 style={{ margin: "0 0 6px" }}>📸 AI Meal Photo Analysis</h3>
                    <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>
                        Upload food photos for automatic identification, portion sizing, calories, and macronutrient analysis.
                    </p>
                </div>
                {items.length > 0 && (
                    <button className="btn-danger" onClick={clearAll} style={{ margin: 0, padding: "8px 14px", fontSize: "13px" }}>
                        Clear All
                    </button>
                )}
            </div>

            {/* Upload Area */}
            <div
                style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "14px",
                    padding: "26px",
                    textAlign: "center",
                    background: "#f8fafc",
                    marginBottom: "20px"
                }}
            >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>🥗 📸</div>
                <label
                    style={{
                        display: "inline-block",
                        background: "#2d8a59",
                        color: "white",
                        padding: "10px 22px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px"
                    }}
                >
                    + Choose Food Photos (One or Multiple)
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleFilesChange}
                        style={{ display: "none" }}
                    />
                </label>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                    Supports JPG, PNG, and WebP up to 15MB each
                </div>
            </div>

            {/* Global Actions */}
            {items.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        background: "#f1f5f9",
                        padding: "12px 18px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}
                >
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                        Selected: {items.length} &bull; Analyzed: {analyzedCount} of {items.length}
                    </span>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            disabled={globalLoading || items.length === 0}
                            onClick={analyzeAll}
                            style={{ margin: 0 }}
                        >
                            {globalLoading ? "Analyzing Photos..." : `⚡ Analyze All (${items.length})`}
                        </button>
                        {unsavedCount > 0 && (
                            <button
                                onClick={saveAllAnalyzed}
                                style={{ background: "#0284c7", margin: 0 }}
                            >
                                💾 Save All to History ({unsavedCount})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {errorMsg && (
                <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#fee2e2", color: "#b91c1c", fontSize: "14px" }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            {/* Items Grid */}
            {items.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "18px",
                                background: "white",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "20px",
                                alignItems: "center"
                            }}
                        >
                            <div style={{ position: "relative", width: "130px", height: "120px", flexShrink: 0 }}>
                                <img
                                    src={item.preview}
                                    alt={"Photo " + (index + 1)}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                                />
                                <span style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(0,0,0,0.7)", color: "white", fontSize: "11px", fontWeight: "700", padding: "2px 7px", borderRadius: "6px" }}>
                                    #{index + 1}
                                </span>
                            </div>

                            <div style={{ flex: "1", minWidth: "260px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>{item.file.name}</div>
                                        <h4 style={{ margin: "2px 0 0", fontSize: "17px", color: "#18352a" }}>
                                            {item.result ? item.result.mealName : "Meal Photo #" + (index + 1)}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        style={{ background: "transparent", border: "0", color: "#94a3b8", cursor: "pointer", fontSize: "18px", margin: 0, padding: 4 }}
                                        title="Remove photo"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {item.loading && (
                                    <div style={{ color: "#2563eb", fontSize: "14px", padding: "8px 0" }}>
                                        ⏳ Analyzing with AI...
                                    </div>
                                )}

                                {item.error && (
                                    <div style={{ color: "#dc2626", fontSize: "13px", padding: "6px 0" }}>
                                        ⚠️ {item.error}
                                    </div>
                                )}

                                {item.result && (
                                    <div style={{ marginTop: "8px" }}>
                                        <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                                            📏 <b>Portion:</b> {item.result.portion}
                                        </div>

                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                                            <span className="badge badge-red">🔥 {item.result.calories} kcal</span>
                                            <span className="badge badge-green">💪 {item.result.protein}g protein</span>
                                            <span className="badge badge-blue">🍚 {item.result.carbohydrates}g carbs</span>
                                            <span className="badge badge-amber">🥑 {item.result.fats}g fat</span>
                                        </div>

                                        {item.result.disclaimer && (
                                            <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", marginBottom: "10px" }}>
                                                ℹ️ {item.result.disclaimer}
                                            </div>
                                        )}

                                        <button
                                            disabled={item.saved}
                                            onClick={() => saveMeal(item)}
                                            style={{
                                                background: item.saved ? "#10b981" : "#2d8a59",
                                                margin: 0,
                                                padding: "7px 14px",
                                                fontSize: "13px"
                                            }}
                                        >
                                            {item.saved ? "✓ Saved to History" : "Confirm & Save Meal"}
                                        </button>
                                    </div>
                                )}

                                {!item.result && !item.loading && (
                                    <button
                                        onClick={() => analyzeItem(item)}
                                        style={{ margin: "8px 0 0", padding: "7px 14px", fontSize: "13px" }}
                                    >
                                        ⚡ Analyze This Photo
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ==================== AI DIET PLAN ====================

function DietPlan({ user, setPage }) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(API + "/recommendations/daily/" + user.id)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => setPlan(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [user.id]);

    if (loading) {
        return <div className="card">Generating tailored AI diet recommendations...</div>;
    }

    if (!plan) {
        return <div className="card">Unable to load diet recommendations at this time.</div>;
    }

    return (
        <section>
            {/* Status Recommendation Banner */}
            <div
                className="card"
                style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                    border: "1px solid #bbf7d0"
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ fontSize: "28px" }}>🥗</div>
                    <span className="badge badge-green">
                        🎯 Goal: {plan.goal || "Healthy Nutrition"}
                    </span>
                </div>
                <h3 style={{ margin: "0 0 8px", color: "#166534", fontSize: "20px" }}>Today's AI Recommendation</h3>
                <p style={{ margin: 0, color: "#1f2937", fontSize: "15px", lineHeight: "1.5" }}>
                    {plan.statusMessage}
                </p>
            </div>

            {/* Remaining Budget & Metabolic Metrics */}
            <div className="grid">
                <Stat
                    title="Calories Remaining"
                    value={plan.leftCalories}
                    unit="kcal"
                    target={plan.targetCalories}
                    color="#2d8a59"
                />
                <Stat
                    title="Protein Remaining"
                    value={plan.leftProtein}
                    unit="g"
                    target={plan.targetProtein}
                    color="#10b981"
                />
                <Stat
                    title="Carbs Remaining"
                    value={plan.leftCarbs}
                    unit="g"
                    target={plan.targetCarbs}
                    color="#3b82f6"
                />
                <Stat
                    title="Calories Burned (TDEE)"
                    value={plan.caloriesBurnedToday}
                    unit="kcal"
                    color="#f59e0b"
                />
            </div>

            {/* Suggested Meal Cards */}
            <div className="card">
                <h3 style={{ margin: "0 0 16px" }}>Tailored Meal Recommendations</h3>

                {plan.suggestedMeals && plan.suggestedMeals.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {plan.suggestedMeals.map((meal, idx) => (
                            <div
                                key={idx}
                                style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "14px",
                                    padding: "18px",
                                    background: "#f8fafc"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <div>
                                        <span className="badge badge-blue" style={{ marginBottom: "6px" }}>
                                            {meal.type}
                                        </span>
                                        <h4 style={{ margin: "4px 0", fontSize: "17px", color: "#18352a" }}>
                                            {meal.title}
                                        </h4>
                                    </div>
                                    <span style={{ fontWeight: "700", color: "#166534", fontSize: "16px" }}>
                                        {meal.calories} kcal
                                    </span>
                                </div>

                                <p style={{ margin: "0 0 12px", color: "#475569", fontSize: "14px" }}>
                                    {meal.description}
                                </p>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <span className="badge badge-green">💪 {meal.protein}g protein</span>
                                    <span className="badge badge-blue">🍚 {meal.carbs}g carbs</span>
                                    <span className="badge badge-amber">🥑 {meal.fat}g fat</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No meals needed right now — you are on track with your nutritional targets!</p>
                )}
            </div>
        </section>
    );
}


// ==================== ANALYTICS & REPORTS ====================

function Reports({ user }) {
    const [days, setDays] = useState(7);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    function loadReport(selectedDays) {
        setLoading(true);
        setError(null);
        fetch(API + "/meals/reports/" + user.id + "?days=" + selectedDays)
            .then(async (r) => {
                if (!r.ok) {
                    const err = await r.json().catch(() => ({}));
                    throw new Error(err.message || "Failed to load report (" + r.status + ")");
                }
                return r.json();
            })
            .then((data) => setReport(data))
            .catch((err) => {
                console.error("Report fetch error:", err);
                setError(err.message || "Unable to load reports from backend");
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadReport(days);
    }, [user.id, days]);

    function exportCSV() {
        if (!report || !report.dailyBreakdown || report.dailyBreakdown.length === 0) return;
        const headers = ["Date", "Day", "Meals Count", "Calories (kcal)", "Target Calories (kcal)", "Calories Burned (kcal)", "Net Calories (kcal)", "Protein (g)", "Carbohydrates (g)", "Fats (g)"];
        const rows = report.dailyBreakdown.map((r) => [
            r.date,
            r.dayOfWeek,
            r.mealsCount,
            r.calories,
            r.targetCalories,
            r.caloriesBurned,
            r.netCalories,
            r.protein,
            r.carbohydrates,
            r.fats
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `nutrigen_report_${report.period.toLowerCase()}_${report.from}_to_${report.to}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <section>
            {/* Header Toolbar: Range Switcher + CSV Export + Refresh */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        className={days === 7 ? "" : "btn-secondary"}
                        onClick={() => setDays(7)}
                        style={{ margin: 0 }}
                    >
                        📅 7-Day Weekly
                    </button>
                    <button
                        className={days === 14 ? "" : "btn-secondary"}
                        onClick={() => setDays(14)}
                        style={{ margin: 0 }}
                    >
                        🗓️ 14-Day Bi-Weekly
                    </button>
                    <button
                        className={days === 30 ? "" : "btn-secondary"}
                        onClick={() => setDays(30)}
                        style={{ margin: 0 }}
                    >
                        📆 30-Day Monthly
                    </button>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        className="btn-secondary"
                        onClick={() => loadReport(days)}
                        style={{ margin: 0, padding: "8px 14px", fontSize: "13px" }}
                    >
                        🔄 Refresh
                    </button>
                    {report && (
                        <button
                            onClick={exportCSV}
                            style={{ margin: 0, padding: "8px 14px", fontSize: "13px", background: "#0284c7" }}
                        >
                            📥 Export CSV
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
                    <p style={{ margin: 0, color: "#64748b" }}>Generating nutrition analytics & metabolic report...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "24px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
                    <h3 style={{ margin: "0 0 8px", color: "#b91c1c" }}>Unable to Load Analytics</h3>
                    <p style={{ color: "#7f1d1d", margin: "0 0 16px", fontSize: "14px" }}>{error}</p>
                    <button onClick={() => loadReport(days)} style={{ margin: 0 }}>
                        🔄 Try Again
                    </button>
                </div>
            ) : report ? (
                <>
                    {/* Key Metrics Grid */}
                    <div className="grid">
                        <Stat
                            title="Total Intake"
                            value={report.totalCaloriesIntake}
                            unit="kcal"
                            color="#2d8a59"
                        />
                        <Stat
                            title="Avg Daily Intake"
                            value={report.avgDailyCaloriesIntake}
                            unit="kcal"
                            target={report.targetDailyCalories}
                            color="#10b981"
                        />
                        <Stat
                            title="Daily Burned (TDEE)"
                            value={report.dailyCaloriesBurned}
                            unit="kcal"
                            color="#f59e0b"
                        />
                        <Stat
                            title="Days On Track"
                            value={`${report.onTrackDays} / ${report.days}`}
                            unit="days"
                            color="#3b82f6"
                        />
                    </div>

                    {/* Macro Distribution Summary Card */}
                    <div className="card" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px 22px" }}>
                        <div>
                            <h4 style={{ margin: "0 0 4px", fontSize: "15px" }}>Macro Energy Distribution ({report.period})</h4>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                Period averages: {report.avgDailyProtein}g protein &bull; {report.avgDailyCarbs}g carbs &bull; {report.avgDailyFats}g fats
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <span className="badge badge-green">💪 Protein: {report.proteinPct || 0}%</span>
                            <span className="badge badge-blue">🍚 Carbs: {report.carbsPct || 0}%</span>
                            <span className="badge badge-amber">🥑 Fats: {report.fatsPct || 0}%</span>
                        </div>
                    </div>

                    {/* Daily Calorie Intake vs Burn Trend Visualization */}
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: "0 0 4px" }}>Daily Intake vs Target Trend</h3>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>
                                    Visual tracking of daily intake across the {report.days}-day period
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }}></span> Target Met
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}></span> Over Budget
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e2e8f0" }}></span> Under
                                </span>
                            </div>
                        </div>

                        {/* Interactive mini bar chart */}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "140px", padding: "10px 0 20px", borderBottom: "1px solid #f1f5f9", overflowX: "auto" }}>
                            {report.dailyBreakdown.map((row) => {
                                const maxCal = Math.max(report.targetDailyCalories * 1.3, ...report.dailyBreakdown.map((r) => r.calories));
                                const heightPct = maxCal > 0 ? Math.min(100, Math.max(8, Math.round((row.calories / maxCal) * 100))) : 8;
                                const isOver = row.calories > row.targetCalories;
                                const isMet = Math.abs(row.calories - row.targetCalories) <= 250 && row.calories > 0;
                                const barColor = isOver ? "#ef4444" : isMet ? "#10b981" : row.calories > 0 ? "#3b82f6" : "#cbd5e1";

                                return (
                                    <div
                                        key={row.date}
                                        style={{
                                            flex: "1",
                                            minWidth: "28px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            height: "100%",
                                            justifyContent: "flex-end"
                                        }}
                                        title={`${row.date} (${row.dayOfWeek}): ${row.calories} kcal of ${row.targetCalories} target`}
                                    >
                                        <span style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px", fontWeight: "600" }}>
                                            {row.calories > 0 ? row.calories : "-"}
                                        </span>
                                        <div
                                            style={{
                                                width: "100%",
                                                maxWidth: "24px",
                                                height: `${heightPct}%`,
                                                background: barColor,
                                                borderRadius: "6px 6px 0 0",
                                                transition: "height 0.3s ease"
                                            }}
                                        ></div>
                                        <span style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>
                                            {row.dayOfWeek}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Daily Breakdown Table */}
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <h3 style={{ margin: 0 }}>
                                {report.period} Detailed Daily Log
                            </h3>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                From <b>{report.from}</b> to <b>{report.to}</b>
                            </span>
                        </div>
                        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>
                            Comprehensive view of daily calorie intake, metabolic burn, net balance, and macros.
                        </p>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Day</th>
                                        <th>Meals</th>
                                        <th>Intake</th>
                                        <th>Target</th>
                                        <th>Burned</th>
                                        <th>Net Balance</th>
                                        <th>Protein</th>
                                        <th>Carbs</th>
                                        <th>Fat</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.dailyBreakdown.map((row) => (
                                        <tr key={row.date}>
                                            <td style={{ fontWeight: "600" }}>{row.date}</td>
                                            <td>{row.dayOfWeek}</td>
                                            <td>{row.mealsCount}</td>
                                            <td style={{ fontWeight: "700" }}>{row.calories} kcal</td>
                                            <td>{row.targetCalories} kcal</td>
                                            <td>{row.caloriesBurned} kcal</td>
                                            <td style={{ color: row.netCalories > 0 ? "#dc2626" : "#16a34a", fontWeight: "600" }}>
                                                {row.netCalories > 0 ? `+${row.netCalories}` : row.netCalories} kcal
                                            </td>
                                            <td>{row.protein}g</td>
                                            <td>{row.carbohydrates || 0}g</td>
                                            <td>{row.fats || 0}g</td>
                                            <td>
                                                {row.mealsCount === 0 ? (
                                                    <span className="badge badge-gray">No logs</span>
                                                ) : Math.abs(row.calories - row.targetCalories) <= 250 ? (
                                                    <span className="badge badge-green">🎯 On Track</span>
                                                ) : row.calories > row.targetCalories ? (
                                                    <span className="badge badge-red">⚠️ Over</span>
                                                ) : (
                                                    <span className="badge badge-amber">Under</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </section>
    );
}


// ==================== MEAL HISTORY ====================

function History({ user }) {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    function loadHistory() {
        setLoading(true);
        fetch(API + "/meals/user/" + user.id)
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setMeals(data);
                } else {
                    setMeals([]);
                }
            })
            .catch((error) => {
                console.error(error);
                setMeals([]);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadHistory();
    }, [user.id]);

    async function deleteMeal(mealId) {
        if (!confirm("Are you sure you want to remove this meal from your history?")) return;

        try {
            const res = await fetch(API + "/meals/" + mealId, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to delete meal");
            }
            setMeals((prev) => prev.filter((m) => m.id !== mealId));
        } catch (e) {
            alert("Error deleting meal: " + e.message);
        }
    }

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                    <h3 style={{ margin: "0 0 4px" }}>Meal History</h3>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>
                        Recorded meals, portion sizes, calories, and macros
                    </span>
                </div>
                <button className="btn-secondary" onClick={loadHistory} style={{ margin: 0, padding: "7px 14px" }}>
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <p>Loading meal history...</p>
            ) : meals.length > 0 ? (
                meals.map((meal) => (
                    <div className="meal" key={meal.id}>
                        <div className="meal-info">
                            <div className="meal-name">{meal.foodName}</div>
                            <div className="meal-meta">
                                {meal.calories} kcal &bull; {meal.protein}g protein &bull; {meal.carbohydrates || 0}g carbs &bull; {meal.fats || 0}g fat &bull; {meal.portion}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                Logged on: {meal.mealDate} {meal.createdAt ? `at ${meal.createdAt.substring(11, 16)}` : ""}
                            </div>
                        </div>

                        <button
                            className="btn-danger"
                            onClick={() => deleteMeal(meal.id)}
                            style={{ margin: 0, padding: "6px 12px", fontSize: "12px" }}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                ))
            ) : (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>🍽️</div>
                    <p style={{ margin: 0 }}>No meals saved yet. Upload a photo in <b>Analyze Meal</b> to start tracking!</p>
                </div>
            )}
        </div>
    );
}


// ==================== NUTRITION PIE CHART COMPONENT ====================

function NutritionPieChart({ protein, carbs, fat, calories, targetCalories, title }) {
    const protGrams = Math.max(0, Number(protein) || 0);
    const carbsGrams = Math.max(0, Number(carbs) || 0);
    const fatGrams = Math.max(0, Number(fat) || 0);

    const protCal = protGrams * 4;
    const carbCal = carbsGrams * 4;
    const fatCal = fatGrams * 9;
    const macroCalTotal = protCal + carbCal + fatCal;
    const displayCal = Math.round(calories || macroCalTotal);

    const protPct = macroCalTotal > 0 ? Math.round((protCal / macroCalTotal) * 100) : 0;
    const carbPct = macroCalTotal > 0 ? Math.round((carbCal / macroCalTotal) * 100) : 0;
    const fatPct = macroCalTotal > 0 ? Math.max(0, 100 - protPct - carbPct) : 0;

    const radius = 75;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    const protLen = macroCalTotal > 0 ? (protCal / macroCalTotal) * circumference : 0;
    const carbLen = macroCalTotal > 0 ? (carbCal / macroCalTotal) * circumference : 0;
    const fatLen = macroCalTotal > 0 ? (fatCal / macroCalTotal) * circumference : 0;

    const protOffset = 0;
    const carbOffset = -protLen;
    const fatOffset = -(protLen + carbLen);

    const goalCal = targetCalories || 2000;
    const goalPct = Math.min(100, Math.round((displayCal / goalCal) * 100));

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            {title && <h4 style={{ margin: "0", color: "#18352a", fontSize: "17px" }}>{title}</h4>}

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "36px", width: "100%" }}>
                {/* SVG Donut */}
                <div style={{ position: "relative", width: "210px", height: "210px", flexShrink: 0 }}>
                    <svg
                        width="210"
                        height="210"
                        viewBox="0 0 210 210"
                        style={{ transform: "rotate(-90deg)" }}
                    >
                        <circle
                            cx="105"
                            cy="105"
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth={strokeWidth}
                        />

                        {macroCalTotal > 0 && (
                            <>
                                <circle
                                    cx="105"
                                    cy="105"
                                    r={radius}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${protLen} ${circumference}`}
                                    strokeDashoffset={protOffset}
                                />
                                <circle
                                    cx="105"
                                    cy="105"
                                    r={radius}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${carbLen} ${circumference}`}
                                    strokeDashoffset={carbOffset}
                                />
                                <circle
                                    cx="105"
                                    cy="105"
                                    r={radius}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${fatLen} ${circumference}`}
                                    strokeDashoffset={fatOffset}
                                />
                            </>
                        )}
                    </svg>

                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center"
                        }}
                    >
                        <span style={{ fontSize: "28px", fontWeight: "800", color: "#18352a", lineHeight: 1 }}>
                            {displayCal}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginTop: "4px" }}>
                            kcal
                        </span>
                        {targetCalories && (
                            <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                {goalPct}% of goal
                            </span>
                        )}
                    </div>
                </div>

                {/* Macro Legend */}
                <div style={{ flex: "1", minWidth: "250px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                                <strong style={{ color: "#065f46" }}>Protein</strong>
                            </div>
                            <span style={{ fontWeight: "700", color: "#065f46" }}>
                                {Math.round(protGrams)}g ({protPct}%)
                            </span>
                        </div>
                    </div>

                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "12px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
                                <strong style={{ color: "#1e40af" }}>Carbohydrates</strong>
                            </div>
                            <span style={{ fontWeight: "700", color: "#1e40af" }}>
                                {Math.round(carbsGrams)}g ({carbPct}%)
                            </span>
                        </div>
                    </div>

                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "12px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
                                <strong style={{ color: "#92400e" }}>Fats</strong>
                            </div>
                            <span style={{ fontWeight: "700", color: "#92400e" }}>
                                {Math.round(fatGrams)}g ({fatPct}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ==================== PROFILE (PIE CHART & EDIT MODAL) ====================

function Profile({ user, onProfileUpdated }) {
    const [profile, setProfile] = useState(null);
    const [summary, setSummary] = useState(null);
    const [viewMode, setViewMode] = useState("today");
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(false);

    // Edit form states
    const [editName, setEditName] = useState("");
    const [editAge, setEditAge] = useState("");
    const [editGender, setEditGender] = useState("Male");
    const [editHeight, setEditHeight] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editActivity, setEditActivity] = useState("Moderate");
    const [editGoal, setEditGoal] = useState("Maintenance");
    const [editCal, setEditCal] = useState(2000);
    const [editProt, setEditProt] = useState(100);
    const [editCarbs, setEditCarbs] = useState(250);
    const [editFat, setEditFat] = useState(65);
    const [saving, setSaving] = useState(false);

    function fetchProfileData() {
        setLoading(true);
        Promise.all([
            fetch(API + "/users/" + user.id).then((r) => (r.ok ? r.json() : null)),
            fetch(API + "/meals/summary/" + user.id + "?days=1").then((r) => (r.ok ? r.json() : null))
        ])
            .then(([userData, summaryData]) => {
                const u = userData && !userData.message ? userData : user;
                setProfile(u);
                setSummary(summaryData);

                // Populate edit fields
                setEditName(u.name || "");
                setEditAge(u.age || "");
                setEditGender(u.gender || "Male");
                setEditHeight(u.heightCm || "");
                setEditWeight(u.weightKg || "");
                setEditActivity(u.activityLevel || "Moderate");
                setEditGoal(u.goal || "Maintenance");
                setEditCal(u.dailyCalories || 2000);
                setEditProt(u.dailyProtein || 100);
                setEditCarbs(u.dailyCarbs || 250);
                setEditFat(u.dailyFat || 65);
            })
            .catch((err) => {
                console.error(err);
                setProfile(user);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        fetchProfileData();
    }, [user.id]);

    // Auto-calculate suggested calorie & macro targets based on biometrics (Mifflin-St Jeor)
    function autoCalculateTargets() {
        const w = Number(editWeight) || 70;
        const h = Number(editHeight) || 172;
        const a = Number(editAge) || 25;
        const isMale = editGender.toLowerCase() === "male";

        let bmr = 10 * w + 6.25 * h - 5 * a + (isMale ? 5 : -161);
        if (bmr < 1200) bmr = 1600;

        let mult = 1.55;
        const act = editActivity.toLowerCase();
        if (act.includes("sedent")) mult = 1.2;
        else if (act.includes("light")) mult = 1.375;
        else if (act.includes("mod")) mult = 1.55;
        else if (act.includes("high") || act.includes("very")) mult = 1.725;
        else if (act.includes("athlete")) mult = 1.9;

        let tdee = Math.round(bmr * mult);
        const goal = editGoal.toLowerCase();
        let targetCals = tdee;
        if (goal.includes("loss")) targetCals = Math.round(tdee - 450);
        else if (goal.includes("gain") || goal.includes("muscle")) targetCals = Math.round(tdee + 350);

        // Standard recommended macro split
        const pGrams = Math.round(w * (goal.includes("gain") ? 2.0 : 1.6));
        const fGrams = Math.round((targetCals * 0.25) / 9);
        const cGrams = Math.max(50, Math.round((targetCals - pGrams * 4 - fGrams * 9) / 4));

        setEditCal(targetCals);
        setEditProt(pGrams);
        setEditCarbs(cGrams);
        setEditFat(fGrams);
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const body = {
                name: editName.trim(),
                age: editAge ? Number(editAge) : null,
                gender: editGender,
                heightCm: editHeight ? Number(editHeight) : null,
                weightKg: editWeight ? Number(editWeight) : null,
                activityLevel: editActivity,
                goal: editGoal,
                dailyCalories: Number(editCal) || 2000,
                dailyProtein: Number(editProt) || 100,
                dailyCarbs: Number(editCarbs) || 250,
                dailyFat: Number(editFat) || 65
            };

            const response = await fetch(API + "/users/" + user.id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to update profile");
            }

            const updatedUser = await response.json();
            setProfile(updatedUser);
            if (onProfileUpdated) onProfileUpdated(updatedUser);
            setEditModal(false);
            alert("Profile & nutrition targets updated successfully!");
        } catch (err) {
            alert("Error saving profile: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading || !profile) {
        return <div className="card">Loading nutrition profile...</div>;
    }

    const todayCalories = summary?.calories || 0;
    const todayProtein = summary?.protein || 0;
    const todayCarbs = summary?.carbohydrates || 0;
    const todayFat = summary?.fats || 0;

    const targetCalories = profile.dailyCalories || 2000;
    const targetProtein = profile.dailyProtein || 100;
    const targetCarbs = profile.dailyCarbs || 250;
    const targetFat = profile.dailyFat || 65;

    return (
        <div className="card" style={{ maxWidth: "860px" }}>
            {/* User Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #eef2ef", paddingBottom: "16px", marginBottom: "20px" }}>
                <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "22px" }}>{profile.name}</h3>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>{profile.email}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="badge badge-green">🎯 {profile.goal || "Healthy Nutrition"}</span>
                    {profile.gender && (
                        <span className="badge badge-gray">
                            {profile.gender} {profile.age ? `· ${profile.age} yrs` : ""}
                        </span>
                    )}
                    <button
                        className="btn-secondary"
                        onClick={() => setEditModal(true)}
                        style={{ margin: 0, padding: "6px 14px", fontSize: "13px" }}
                    >
                        ✏️ Edit Profile
                    </button>
                </div>
            </div>

            {/* Toggle Modes */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                <button
                    className={viewMode === "today" ? "" : "btn-secondary"}
                    onClick={() => setViewMode("today")}
                    style={{ margin: 0 }}
                >
                    🥧 Today's Intake Macronutrients
                </button>
                <button
                    className={viewMode === "target" ? "" : "btn-secondary"}
                    onClick={() => setViewMode("target")}
                    style={{ margin: 0 }}
                >
                    📊 Daily Target Macro Split
                </button>
            </div>

            {/* Pie Chart Display */}
            {viewMode === "today" ? (
                todayCalories > 0 ? (
                    <NutritionPieChart
                        title="Today's Intake Macronutrient Split"
                        protein={todayProtein}
                        carbs={todayCarbs}
                        fat={todayFat}
                        calories={todayCalories}
                        targetCalories={targetCalories}
                    />
                ) : (
                    <div style={{ textAlign: "center", padding: "24px 10px" }}>
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🥗</div>
                        <h4 style={{ margin: "0 0 6px", color: "#18352a" }}>No Meals Logged Today Yet</h4>
                        <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "14px" }}>
                            Upload meal photos in <b>Analyze Meal</b> to track macros. Here is your target split:
                        </p>
                        <NutritionPieChart
                            title="Daily Target Nutrition Split"
                            protein={targetProtein}
                            carbs={targetCarbs}
                            fat={targetFat}
                            calories={0}
                            targetCalories={targetCalories}
                        />
                    </div>
                )
            ) : (
                <NutritionPieChart
                    title="Daily Target Nutrition Breakdown"
                    protein={targetProtein}
                    carbs={targetCarbs}
                    fat={targetFat}
                    calories={targetCalories}
                    targetCalories={targetCalories}
                />
            )}

            {/* Edit Profile Modal */}
            {editModal && (
                <div className="modal-backdrop" onClick={() => setEditModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0 }}>✏️ Edit Profile & Nutrition Goals</h3>
                            <button
                                onClick={() => setEditModal(false)}
                                style={{ background: "transparent", border: 0, color: "#64748b", fontSize: "20px", cursor: "pointer", margin: 0, padding: 4 }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Age (years)</label>
                                    <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} placeholder="e.g. 26" />
                                </div>
                                <div className="form-group">
                                    <label>Height (cm)</label>
                                    <input type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} placeholder="e.g. 175" />
                                </div>
                                <div className="form-group">
                                    <label>Weight (kg)</label>
                                    <input type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} placeholder="e.g. 70" />
                                </div>
                                <div className="form-group">
                                    <label>Activity Level</label>
                                    <select value={editActivity} onChange={(e) => setEditActivity(e.target.value)}>
                                        <option value="Sedentary">Sedentary (desk job, low movement)</option>
                                        <option value="Light">Light (1-3 days exercise)</option>
                                        <option value="Moderate">Moderate (3-5 days workout)</option>
                                        <option value="High">Very Active (6-7 days intense)</option>
                                        <option value="Athlete">Athlete / Physical work</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: "span 2" }}>
                                    <label>Primary Fitness Goal</label>
                                    <select value={editGoal} onChange={(e) => setEditGoal(e.target.value)}>
                                        <option value="Weight Loss">Weight Loss & Fat Reduction</option>
                                        <option value="Muscle Gain">Muscle Gain & Hypertrophy</option>
                                        <option value="Maintenance">Maintenance & Healthy Lifestyle</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
                                        🎯 Daily Targets
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={autoCalculateTargets}
                                        style={{ margin: 0, padding: "5px 10px", fontSize: "12px" }}
                                    >
                                        ⚡ Auto-Calculate Targets
                                    </button>
                                </div>

                                <div className="form-grid" style={{ margin: 0 }}>
                                    <div className="form-group">
                                        <label>Calories (kcal)</label>
                                        <input type="number" value={editCal} onChange={(e) => setEditCal(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Protein (g)</label>
                                        <input type="number" value={editProt} onChange={(e) => setEditProt(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Carbohydrates (g)</label>
                                        <input type="number" value={editCarbs} onChange={(e) => setEditCarbs(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fats (g)</label>
                                        <input type="number" value={editFat} onChange={(e) => setEditFat(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setEditModal(false)}
                                    style={{ margin: 0 }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} style={{ margin: 0 }}>
                                    {saving ? "Saving..." : "Save Profile & Targets"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


// ==================== BOOTSTRAP APP ====================

createRoot(document.getElementById("root")).render(<App />);