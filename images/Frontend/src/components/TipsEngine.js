// src/components/TipsEngine.js
export const generateDogTips = (dog, entries) => {
  const tips = [];
  if (!entries.length) return tips;

  const safeNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const last7 = entries.slice(0, 7);

  const avgWater =
    last7.reduce((s, e) => s + safeNum(e.water), 0) / last7.length;

  const stressCount = last7.filter(e => e.stressSignals).length;
  const lowSleep = last7.filter(e => safeNum(e.sleepHours) < 6).length;
  const lowWalks = last7.filter(e => safeNum(e.walks) <= 1).length;

  if (avgWater < 400) {
    tips.push({
      severity: "medium",
      title: "💧 Lage waterinname",
      description: `${dog.name} drinkt gemiddeld weinig water.`,
      advice: [
        "Gebruik een andere drinkbak (metaal/keramiek)",
        "Plaats meerdere waterbakken",
        "Voeg water toe aan natvoer"
      ]
    });
  }

  if (stressCount >= 2) {
    tips.push({
      severity: stressCount >= 4 ? "high" : "medium",
      title: "😰 Stress-signalen",
      description: `${stressCount} stressmomenten deze week.`,
      advice: [
        "Zorg voor vaste routines",
        "Gebruik verrijkingsspeelgoed",
        "Beperk prikkels"
      ]
    });
  }

  if (lowSleep >= 3) {
    tips.push({
      severity: "medium",
      title: "💤 Onvoldoende slaap",
      description: "Meerdere dagen weinig rust.",
      advice: [
        "Voorzie een vaste slaapplek",
        "Vermijd prikkels laat op de avond"
      ]
    });
  }

  if (lowWalks >= 3) {
    tips.push({
      severity: "soft",
      title: "🚶 Weinig beweging",
      description: "Weinig wandelingen deze week.",
      advice: [
        "Extra korte wandelingen",
        "Snuffelwandelingen"
      ]
    });
  }

  return tips;
};
