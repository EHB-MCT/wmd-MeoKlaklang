// src/components/DogTips.jsx
export default function DogTips({ dog, tips }) {
  return (
    <div className="dog-tips">
      <h4>💡 Tips & Tricks</h4>

      {tips.length === 0 ? (
        <p className="tip-ok">✅ Alles ziet er goed uit!</p>
      ) : (
        tips.map((tip, idx) => (
          <div key={idx} className={`tip-card tip-${tip.severity}`}>
            <h5>{tip.title}</h5>
            <p>{tip.description}</p>
            <ul>
              {tip.advice.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
