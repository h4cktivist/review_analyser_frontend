import React, { useEffect, useMemo, useState } from "react";
import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis,
    ResponsiveContainer,
    LineChart, Line
} from "recharts";
import {TrendingUp, MessageSquare, Smile, Frown, MehIcon} from "lucide-react";
import { reviewsAPI } from "../../services/api";
import {Link} from "react-router-dom";

const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "1.25rem",
    background: "linear-gradient(180deg, #ffffff, #fafafa)",
    boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
};

const cardTitle = {
    fontWeight: 600,
    fontSize: "1rem",
    marginBottom: "1rem",
    color: "#1f2937",
};

const kpiValue = {
    fontSize: "1.8rem",
    fontWeight: 700,
};

const sentimentColors = {
    positive: "#22c55e",
    negative: "#ef4444",
    neutral: "#f59e0b",
};

const filterStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
    backgroundColor: "white",
    cursor: "pointer",
}

export default function ReviewsDashboard() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeMode, setTimeMode] = useState("month");
    const [selectedDrilldown, setSelectedDrilldown] = useState(null);
    const [filters, setFilters] = useState({
        sentiment: null,      // "positive" | "negative" | "neutral" | null
        aspect: null,         // { name, polarity } | null
        source: null,         // string | null
        dateFrom: null,       // ISO string | null
        dateTo: null,         // ISO string | null
        institution: null,    // string | null
        event: null           // string | null
    });

    useEffect(() => {
        reviewsAPI.getAll().then((data) => {
            setReviews(data);
            setLoading(false);
        });
    }, []);

    const filteredReviews = useMemo(() => {
        return reviews.filter(r => {
            if (filters.sentiment && r.sentiment !== filters.sentiment) return false;
            if (filters.source && r.source !== filters.source) return false;
            if (filters.aspect) {
                const { name, polarity } = filters.aspect;
                if (polarity === "positive" && !r.positive_aspects.includes(name)) return false;
                if (polarity === "negative" && !r.negative_aspects.includes(name)) return false;
            }
            if (filters.institution && r.institution_name !== filters.institution) return false;
            if (filters.event && r.event_name !== filters.event) return false;
            if (filters.dateFrom && new Date(r.reviewed_at) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(r.reviewed_at) > new Date(filters.dateTo)) return false;
            return true;
        });
    }, [reviews, filters]);

    const stats = useMemo(() => {
        const sentimentCount = { positive: 0, negative: 0, neutral: 0 };
        const positiveAspectCount = {};
        const negativeAspectCount = {};
        const byDate = {};
        const sourceCount = {};
        const institutionCount = {};
        const eventCount = {};

        const groupKey = (iso) => {
            const d = new Date(iso);
            if (timeMode === "year") return String(d.getFullYear());
            if (timeMode === "month") return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            return iso.slice(0,10);
        };

        filteredReviews.forEach(r => {
            sentimentCount[r.sentiment]++;
            r.positive_aspects.forEach(a => positiveAspectCount[a] = (positiveAspectCount[a]||0)+1);
            r.negative_aspects.forEach(a => negativeAspectCount[a] = (negativeAspectCount[a]||0)+1);

            const key = groupKey(r.reviewed_at);
            byDate[key] = (byDate[key]||0)+1;

            sourceCount[r.source] = (sourceCount[r.source]||0) + 1;
            institutionCount[r.institution_name] = (institutionCount[r.institution_name] || 0) + 1;
            if (r.event_name) {
                eventCount[r.event_name] = (eventCount[r.event_name] || 0) + 1;
            }
        });

        return {
            sentimentData: Object.entries(sentimentCount).map(([name,value])=>({name,value})),
            aspectPolarityData: [
                { name:"Позитивные аспекты", value:Object.values(positiveAspectCount).reduce((a,b)=>a+b,0)},
                { name:"Негативные аспекты", value:Object.values(negativeAspectCount).reduce((a,b)=>a+b,0)}
            ],
            positiveAspects: Object.entries(positiveAspectCount).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6),
            negativeAspects: Object.entries(negativeAspectCount).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6),
            timeline: Object.entries(byDate).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,value])=>({date,value})),
            sourceData: Object.entries(sourceCount).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
            institutionData: Object.entries(institutionCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),
            eventData: Object.entries(eventCount)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),
        };
    }, [filteredReviews, timeMode]);

    const drilldownReviews = useMemo(() => {
        if (!selectedDrilldown) return [];

        const { type, value, polarity } = selectedDrilldown;

        return filteredReviews.filter(r => {
            switch (type) {
                case "aspect":
                    if (polarity === "positive") return r.positive_aspects.includes(value);
                    if (polarity === "negative") return r.negative_aspects.includes(value);
                    return false;

                case "sentiment":
                    return r.sentiment === value;

                case "source":
                    return r.source === value;

                case "timeline":
                    const d = new Date(r.reviewed_at);
                    if (timeMode === "year") return String(d.getFullYear()) === value;
                    if (timeMode === "month") return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` === value;
                    return r.reviewed_at.slice(0,10) === value;

                case "institution":
                    return r.institution_name === value;

                case "event":
                    return r.event_name === value;

                default:
                    return false;
            }
        });
    }, [selectedDrilldown, filteredReviews, timeMode]);

    if (loading) {
        return <div style={{ padding: "4rem", textAlign: "center" }}>Загрузка…</div>;
    }

    const timelineKey = {
        "year": "Год",
        "month": "Месяц",
        "day": "День"
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

            <div
                style={{
                    ...cardStyle,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                    alignItems: "flex-end"
                }}
            >
                {/* Тональность */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Тональность</label>
                    <select
                        value={filters.sentiment || ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, sentiment: e.target.value || null }))
                        }
                        style={filterStyle}
                    >
                        <option value="">Все</option>
                        <option value="positive">Позитивная</option>
                        <option value="negative">Негативная</option>
                        <option value="neutral">Нейтральная</option>
                    </select>
                </div>

                {/* Источник */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Источник</label>
                    <select
                        value={filters.source || ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, source: e.target.value || null }))
                        }
                        style={filterStyle}
                    >
                        <option value="">Все</option>
                        {Array.from(new Set(reviews.map((r) => r.source))).map((src) => (
                            <option key={src} value={src}>
                                {src}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Дата от</label>
                    <input
                        type="date"
                        value={filters.dateFrom || ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, dateFrom: e.target.value || null }))
                        }
                        style={filterStyle}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Дата до</label>
                    <input
                        type="date"
                        value={filters.dateTo || ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, dateTo: e.target.value || null }))
                        }
                        style={filterStyle}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>
                        Учреждение
                    </label>
                    <select
                        value={filters.institution || ""}
                        onChange={(e) =>
                            setFilters(f => ({ ...f, institution: e.target.value || null }))
                        }
                        style={filterStyle}
                    >
                        <option value="">Все</option>
                        {Array.from(new Set(reviews.map(r => r.institution_name))).map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>
                        Мероприятие
                    </label>
                    <select
                        value={filters.event || ""}
                        onChange={(e) =>
                            setFilters(f => ({ ...f, event: e.target.value || null }))
                        }
                        style={filterStyle}
                    >
                        <option value="">Все</option>
                        {Array.from(
                            new Set(
                                reviews
                                    .map(r => r.event_name)
                                    .filter(ev => ev)
                            )
                        ).map(ev => (
                            <option key={ev} value={ev}>{ev}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() =>
                        setFilters({
                            sentiment: null,
                            aspect: null,
                            source: null,
                            dateFrom: null,
                            dateTo: null,
                            institution: null,
                            event: null,
                        })
                    }
                    style={{
                        marginLeft: "auto",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#fff",
                        color: "#e74c3c",
                        border: "1px solid #e74c3c",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e74c3c";
                        e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff";
                        e.currentTarget.style.color = "#e74c3c";
                    }}
                >
                    Сбросить фильтры
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                <KPI title="Всего отзывов" value={filteredReviews.length} icon={<MessageSquare />} />
                <KPI title="Позитивные" value={stats.sentimentData.find(s => s.name === "positive")?.value || 0} icon={<Smile />} />
                <KPI title="Негативные" value={stats.sentimentData.find(s => s.name === "negative")?.value || 0} icon={<Frown />} />
                <KPI title="Нейтральные" value={stats.sentimentData.find(s => s.name === "neutral")?.value || 0} icon={<MehIcon />} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                <div style={cardStyle}>
                    <h3 style={cardTitle}>Тональность отзывов</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={stats.sentimentData}
                                dataKey="value"
                                nameKey="name"
                                label
                                onClick={(d) => setSelectedDrilldown({ type: "sentiment", value: d.name })}
                            >
                                {stats.sentimentData.map((s, i) => (
                                    <Cell key={i} fill={sentimentColors[s.name]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div style={cardStyle}>
                    <h3 style={cardTitle}>Распределение аспектов</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={stats.aspectPolarityData}
                                dataKey="value"
                                nameKey="name"
                                label
                            >
                                <Cell fill="#22c55e" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                <AspectBar
                    title="Позитивные аспекты"
                    data={stats.positiveAspects}
                    color="#22c55e"
                    polarity="positive"
                    onSelect={(d) =>
                        setSelectedDrilldown({ type: "aspect", value: d.name, polarity: "positive" })
                    }
                />
                <AspectBar
                    title="Негативные аспекты"
                    data={stats.negativeAspects}
                    color="#ef4444"
                    polarity="negative"
                    onSelect={(d) =>
                        setSelectedDrilldown({ type: "aspect", value: d.name, polarity: "negative" })
                    }
                />
            </div>

            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h3 style={cardTitle}>
                        <TrendingUp size={18} /> Динамика отзывов
                    </h3>
                    <div>
                        {["day", "month", "year"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setTimeMode(m)}
                                style={{
                                    marginLeft: "0.5rem",
                                    padding: "0.3rem 0.6rem",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                    background: timeMode === m ? "#2563eb" : "white",
                                    color: timeMode === m ? "white" : "#333",
                                    cursor: "pointer",
                                }}
                            >
                                {timelineKey[m]}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={stats.timeline}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            dot={{
                                onClick: (d) => setSelectedDrilldown({ type: "timeline", value: d.payload.date }),
                                style: { cursor: "pointer" }
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <HorizontalBar
                    title="Отзывы по учреждениям"
                    data={stats.institutionData}
                    color="#2563eb"
                    type={"institution"}
                    onSelect={setSelectedDrilldown}
                />

                <HorizontalBar
                    title="Отзывы по мероприятиям"
                    data={stats.eventData}
                    color="#10b981"
                    type={"event"}
                    onSelect={setSelectedDrilldown}
                    scroll={true}
                />
            </div>

            <HorizontalBar
                title="Количество отзывов по источникам"
                data={stats.sourceData}
                color="#E9D66B"
                type={"source"}
                onSelect={setSelectedDrilldown}
            />

            {selectedDrilldown && (
                <div style={{ ...cardStyle, marginTop: "2rem" }}>
                    <h3 style={cardTitle}>
                        <span style={{ color: "#2563eb" }}>{selectedDrilldown.value}</span>
                    </h3>
                    <div style={{ maxHeight: "320px", overflowY: "auto", paddingRight: "0.5rem", marginTop: "1rem" }}>
                        {drilldownReviews.map(r => (
                            <div key={r.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
                                <div style={{ lineHeight: 1.5 }}>{r.text}</div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                    {r.institution_name} · {r.source} · <Link to={`/reviews/${r.id}`} style={{ color: "#2563eb" }}>подробнее</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function KPI({ title, value, icon }) {
    return (
        <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{title}</div>
                <div style={kpiValue}>{value}</div>
            </div>
            <div style={{ opacity: 0.7 }}>{icon}</div>
        </div>
    );
}

function AspectBar({ title, data, color, polarity, onSelect }) {
    return (
        <div style={cardStyle}>
            <h3 style={cardTitle}>{title}</h3>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data}>
                    <XAxis dataKey="name"/>
                    <YAxis/>
                    <Tooltip/>
                    <Bar dataKey="value" fill={color} onClick={d => onSelect({ name: d.name, polarity })}/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function HorizontalBar({ title, data, color, onSelect, type, scroll }) {
    return (
        <div style={{
            ...cardStyle,
            gridColumn: "span 2",
            marginTop: "2rem",
            overflowX: scroll ? "auto" : "visible",
            paddingBottom: scroll ? "1rem" : undefined
        }}>
            <h3 style={cardTitle}>{title}</h3>
            <div style={{ minWidth: scroll ? "700px" : "100%", width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={scroll ? 200 : 120} />
                        <Tooltip />
                        <Bar
                            dataKey="value"
                            fill={color}
                            onClick={d => onSelect({ type: type, value: d.name })}
                            cursor="pointer"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
