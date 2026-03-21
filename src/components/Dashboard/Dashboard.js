import React, { useEffect, useMemo, useState } from "react";
import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis,
    ResponsiveContainer,
    LineChart, Line, Legend, Brush
} from "recharts";
import { TrendingUp, MessageSquare, Smile, Frown, MehIcon } from "lucide-react";
import { reviewsAPI } from "../../services/api";
import { Link } from "react-router-dom";

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

/** Видимая высота области скролла горизонтальных bar-графиков по ширине окна */
function barChartViewportHeight(width) {
    if (width < 640) return 260;
    if (width < 900) return 320;
    if (width < 1200) return 400;
    if (width < 1536) return 480;
    return 560;
}

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
        event: null,          // string | null
        aspectCountMin: null, // number | null
        aspectCountMax: null, // number | null
        hasSuggestedActions: null, // boolean | null
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

            const totalAspects = (r.positive_aspects?.length || 0) + (r.negative_aspects?.length || 0);
            if (filters.aspectCountMin !== null && totalAspects < filters.aspectCountMin) return false;
            if (filters.aspectCountMax !== null && totalAspects > filters.aspectCountMax) return false;

            if (filters.hasSuggestedActions === true && (!r.required_actions || r.required_actions.length === 0)) return false;
            if (filters.hasSuggestedActions === false && r.required_actions && r.required_actions.length > 0) return false;

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

        const bumpSentiment = (bucket, key) => {
            if (!bucket[key]) {
                bucket[key] = { positive: 0, negative: 0, neutral: 0 };
            }
            return bucket[key];
        };

        const groupKey = (iso) => {
            const d = new Date(iso);
            if (timeMode === "year") return String(d.getFullYear());
            if (timeMode === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return iso.slice(0, 10);
        };

        let totalActionsCount = 0;

        filteredReviews.forEach(r => {
            if (r.required_actions) totalActionsCount += r.required_actions.length;
            if (sentimentCount[r.sentiment] !== undefined) {
                sentimentCount[r.sentiment] += 1;
            }
            r.positive_aspects.forEach(a => positiveAspectCount[a] = (positiveAspectCount[a] || 0) + 1);
            r.negative_aspects.forEach(a => negativeAspectCount[a] = (negativeAspectCount[a] || 0) + 1);

            const key = groupKey(r.reviewed_at);
            if (!byDate[key]) {
                byDate[key] = { total: 0, positive: 0, negative: 0, neutral: 0 };
            }
            byDate[key].total += 1;
            if (byDate[key][r.sentiment] !== undefined) {
                byDate[key][r.sentiment] += 1;
            }

            const src = bumpSentiment(sourceCount, r.source);
            if (src[r.sentiment] !== undefined) src[r.sentiment] += 1;

            const inst = bumpSentiment(institutionCount, r.institution_name);
            if (inst[r.sentiment] !== undefined) inst[r.sentiment] += 1;

            if (r.event_name) {
                const ev = bumpSentiment(eventCount, r.event_name);
                if (ev[r.sentiment] !== undefined) ev[r.sentiment] += 1;
            }
        });

        return {
            sentimentData: Object.entries(sentimentCount).map(([name, value]) => ({ name, value })),
            aspectPolarityData: [
                { name: "Позитивные аспекты", value: Object.values(positiveAspectCount).reduce((a, b) => a + b, 0) },
                { name: "Негативные аспекты", value: Object.values(negativeAspectCount).reduce((a, b) => a + b, 0) }
            ],
            positiveAspects: Object.entries(positiveAspectCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            negativeAspects: Object.entries(negativeAspectCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
            timeline: Object.entries(byDate)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([date, values]) => ({ date, ...values })),
            sourceData: Object.entries(sourceCount)
                .map(([name, counts]) => ({
                    name,
                    positive: counts.positive,
                    negative: counts.negative,
                    neutral: counts.neutral,
                    value: counts.positive + counts.negative + counts.neutral,
                }))
                .sort((a, b) => b.value - a.value),
            institutionData: Object.entries(institutionCount)
                .map(([name, counts]) => ({
                    name,
                    positive: counts.positive,
                    negative: counts.negative,
                    neutral: counts.neutral,
                    value: counts.positive + counts.negative + counts.neutral,
                }))
                .sort((a, b) => b.value - a.value),
            eventData: Object.entries(eventCount)
                .map(([name, counts]) => ({
                    name,
                    positive: counts.positive,
                    negative: counts.negative,
                    neutral: counts.neutral,
                    value: counts.positive + counts.negative + counts.neutral,
                }))
                .sort((a, b) => b.value - a.value),
            totalActionsCount
        };
    }, [filteredReviews, timeMode]);

    const drilldownReviews = useMemo(() => {
        if (!selectedDrilldown) return [];

        const { type, value, polarity, sentiment: segmentSentiment } = selectedDrilldown;

        return filteredReviews.filter(r => {
            switch (type) {
                case "aspect":
                    if (polarity === "positive") return r.positive_aspects.includes(value);
                    if (polarity === "negative") return r.negative_aspects.includes(value);
                    return false;

                case "sentiment":
                    return r.sentiment === value;

                case "timeline":
                    const d = new Date(r.reviewed_at);
                    if (timeMode === "year") return String(d.getFullYear()) === value;
                    if (timeMode === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === value;
                    return r.reviewed_at.slice(0, 10) === value;

                case "institution":
                    if (r.institution_name !== value) return false;
                    return !segmentSentiment || r.sentiment === segmentSentiment;

                case "event":
                    if (r.event_name !== value) return false;
                    return !segmentSentiment || r.sentiment === segmentSentiment;

                case "source":
                    if (r.source !== value) return false;
                    return !segmentSentiment || r.sentiment === segmentSentiment;

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

    const timelineTooltipContent = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;

        const point = payload[0]?.payload;
        if (!point) return null;

        const rows = payload.map((item) => ({
            name: item.name || item.dataKey,
            value: item.value ?? 0,
            color: item.color || item.stroke || "#64748b"
        }));

        rows.push({
            name: "\u0412\u0441\u0435\u0433\u043e",
            value: point.total ?? 0,
            color: "#2563eb"
        });

        return (
            <div style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "0.5rem 0.75rem",
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
            }}>
                <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>{label}</div>
                {rows.map((row) => (
                    <div
                        key={row.name}
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "999px",
                                backgroundColor: row.color,
                                display: "inline-block"
                            }}
                        />
                        <span>{row.name}: {row.value}</span>
                    </div>
                ))}
            </div>
        );
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

                <div style={{ display: "flex", flexDirection: "column", minWidth: "100px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Аспектов от</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="мин"
                        value={filters.aspectCountMin ?? ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, aspectCountMin: e.target.value === "" ? null : parseInt(e.target.value) }))
                        }
                        style={filterStyle}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: "100px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Аспектов до</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="макс"
                        value={filters.aspectCountMax ?? ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, aspectCountMax: e.target.value === "" ? null : parseInt(e.target.value) }))
                        }
                        style={filterStyle}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                    <label style={{ marginBottom: "0.25rem", fontWeight: 600, color: "#2c3e50" }}>Предложения</label>
                    <select
                        value={filters.hasSuggestedActions === null ? "" : filters.hasSuggestedActions.toString()}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilters(f => ({ ...f, hasSuggestedActions: val === "" ? null : val === "true" }));
                        }}
                        style={filterStyle}
                    >
                        <option value="">Все</option>
                        <option value="true">Есть предложения</option>
                        <option value="false">Нет предложений</option>
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
                            aspectCountMin: null,
                            aspectCountMax: null,
                            hasSuggestedActions: null,
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
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.timeline}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={timelineTooltipContent} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="positive"
                            name="Позитивные"
                            stroke={sentimentColors.positive}
                            dot={{
                                onClick: (d) => setSelectedDrilldown({ type: "timeline", value: d.payload.date }),
                                style: { cursor: "pointer" }
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="neutral"
                            name="Нейтральные"
                            stroke={sentimentColors.neutral}
                            dot={{
                                onClick: (d) => setSelectedDrilldown({ type: "timeline", value: d.payload.date }),
                                style: { cursor: "pointer" }
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="negative"
                            name="Негативные"
                            stroke={sentimentColors.negative}
                            dot={{
                                onClick: (d) => setSelectedDrilldown({ type: "timeline", value: d.payload.date }),
                                style: { cursor: "pointer" }
                            }}
                        />
                        <Brush
                            dataKey="date"
                            height={24}
                            stroke="#94a3b8"
                            travellerWidth={10}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <HorizontalBar
                    title="Отзывы по учреждениям"
                    data={stats.institutionData}
                    type="institution"
                    onSelect={setSelectedDrilldown}
                />

                <HorizontalBar
                    title="Отзывы по мероприятиям"
                    data={stats.eventData}
                    type="event"
                    onSelect={setSelectedDrilldown}
                    scroll={true}
                />
            </div>

            <HorizontalBar
                title="Количество отзывов по источникам"
                data={stats.sourceData}
                type="source"
                onSelect={setSelectedDrilldown}
            />

            {selectedDrilldown && (
                <div style={{ ...cardStyle, marginTop: "2rem" }}>
                    <h3 style={cardTitle}>
                        <span style={{ color: "#2563eb" }}>{selectedDrilldown.value}</span>
                        {selectedDrilldown.sentiment && (
                            <span style={{ color: "#64748b", fontWeight: 500 }}>
                                {" · "}
                                {selectedDrilldown.sentiment === "positive" && "позитивные"}
                                {selectedDrilldown.sentiment === "negative" && "негативные"}
                                {selectedDrilldown.sentiment === "neutral" && "нейтральные"}
                            </span>
                        )}
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
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={color} onClick={d => onSelect({ name: d.name, polarity })} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function HorizontalBar({ title, data, onSelect, type, scroll }) {
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window !== "undefined" ? barChartViewportHeight(window.innerWidth) : 400
    );

    useEffect(() => {
        const onResize = () => setViewportHeight(barChartViewportHeight(window.innerWidth));
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const handleSegmentClick = (sentiment) => (barData) => {
        const row = barData?.payload ?? barData;
        if (!row?.name) return;
        const count = row[sentiment];
        if (count === 0 || count === undefined) return;
        onSelect({ type, value: row.name, sentiment });
    };
    const chartHeight = Math.max(300, data.length * 34);

    return (
        <div style={{
            ...cardStyle,
            gridColumn: "span 2",
            marginTop: "2rem",
            overflowX: scroll ? "auto" : "visible",
            paddingBottom: scroll ? "1rem" : undefined
        }}>
            <h3 style={cardTitle}>{title}</h3>
            <div style={{ maxHeight: viewportHeight, overflowY: "auto" }}>
                <div style={{ minWidth: scroll ? "700px" : "100%", width: "100%", height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                        >
                            <XAxis type="number" />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={scroll ? 240 : 180}
                                interval={0}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                                stackId="sentiment"
                                dataKey="negative"
                                name="Негативные"
                                fill={sentimentColors.negative}
                                onClick={handleSegmentClick("negative")}
                                cursor="pointer"
                            />
                            <Bar
                                stackId="sentiment"
                                dataKey="neutral"
                                name="Нейтральные"
                                fill={sentimentColors.neutral}
                                onClick={handleSegmentClick("neutral")}
                                cursor="pointer"
                            />
                            <Bar
                                stackId="sentiment"
                                dataKey="positive"
                                name="Позитивные"
                                fill={sentimentColors.positive}
                                onClick={handleSegmentClick("positive")}
                                cursor="pointer"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


