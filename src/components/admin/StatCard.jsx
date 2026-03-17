export default function StatCard({ label, value, color = 'lila', rosa, sub }) {
    const isRosa = rosa || color === 'rosa';
    return (
        <div
            className={`stat-card${isRosa ? ' rosa' : ''}`}
            role="figure"
            aria-label={`${label}: ${value}`}
        >
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div style={{ fontSize: '0.72rem', color: isRosa ? '#ff66c4' : '#aaa', marginTop: '4px' }}>{sub}</div>}
        </div>
    );
}
