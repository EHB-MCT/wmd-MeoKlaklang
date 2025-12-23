import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function DailyEntryForm() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    foodIntake: "",
    waterIntake: 0,
    stool: "",
    vomited: false,
    medication: false,
    medicationDetails: "",
    behavior: "",
    mood: "",
    exercise: "",
    sleepQuality: "",
    appetite: "",
    weight: "",
    notes: ""
  });
  const [medicineImage, setMedicineImage] = useState(null);
  const [medicinePreview, setMedicinePreview] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMedicineImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Medicine image size should be less than 5MB");
        return;
      }
      
      setMedicineImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedicinePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderRadioGroup = (label, name, options, icon = "") => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {icon} {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={formData[name] === option.value}
              onChange={handleInputChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMessage("❌ No user found. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('userId', userId);
      formDataToSend.append('entryData', JSON.stringify(formData));
      
      if (medicineImage) {
        formDataToSend.append('medicineImage', medicineImage);
      }

      const response = await fetch("http://localhost:5000/api/entries", {
        method: "POST",
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Daily entry saved successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 Daily Health Entry
          </h1>
          <p className="text-gray-600">
            Track your pet's health and wellbeing today
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/dashboard" className="btn-secondary">
              📊 Dashboard
            </Link>
            <Link to="/analyse" className="btn-secondary">
              📈 Analytics
            </Link>
            <Link to="/pet-registration" className="btn-secondary">
              🐾 Pet Settings
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (optional)
                </label>
                <input
                  type="text"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 25 kg"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Food and Water */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🍽️ Nutrition & Hydration</h2>
            <div className="space-y-4">
              {renderRadioGroup(
                "Food Intake",
                "foodIntake",
                [
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" }
                ],
                "🍽️"
              )}

              <div>
                <label htmlFor="waterIntake" className="block text-sm font-medium text-gray-700 mb-1">
                  💧 Water Intake (ml)
                </label>
                <input
                  type="number"
                  id="waterIntake"
                  name="waterIntake"
                  min="0"
                  max="2000"
                  step="50"
                  value={formData.waterIntake}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              {renderRadioGroup(
                "Appetite",
                "appetite",
                [
                  { value: "poor", label: "Poor" },
                  { value: "normal", label: "Normal" },
                  { value: "excellent", label: "Excellent" }
                ],
                "🍖"
              )}
            </div>
          </div>

          {/* Health Symptoms */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🏥 Health Symptoms</h2>
            <div className="space-y-4">
              {renderRadioGroup(
                "Stool Quality",
                "stool",
                [
                  { value: "none", label: "None" },
                  { value: "hard", label: "Hard" },
                  { value: "normal", label: "Normal" },
                  { value: "soft", label: "Soft" },
                  { value: "diarrhea", label: "Diarrhea" }
                ],
                "💩"
              )}

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="vomited"
                    checked={formData.vomited}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">🤮 Vomited today</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="medication"
                    checked={formData.medication}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">💊 Medication given</span>
                </label>
              </div>

              {formData.medication && (
                <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  <div>
                    <label htmlFor="medicationDetails" className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Details
                    </label>
                    <textarea
                      id="medicationDetails"
                      name="medicationDetails"
                      value={formData.medicationDetails}
                      onChange={handleInputChange}
                      rows={3}
                      className="input-field"
                      placeholder="Medication name, dosage, time given..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📸 Upload Medicine Image (optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      {medicinePreview ? (
                        <img 
                          src={medicinePreview} 
                          alt="Medicine preview" 
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-2xl text-gray-400">💊</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMedicineImageChange}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100
                            cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Behavior and Mood */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🐾 Behavior & Mood</h2>
            <div className="space-y-4">
              {renderRadioGroup(
                "Activity Level",
                "exercise",
                [
                  { value: "low", label: "Low" },
                  { value: "moderate", label: "Moderate" },
                  { value: "high", label: "High" }
                ],
                "🏃"
              )}

              {renderRadioGroup(
                "Behavior",
                "behavior",
                [
                  { value: "active", label: "Active" },
                  { value: "normal", label: "Normal" },
                  { value: "lethargic", label: "Lethargic" },
                  { value: "anxious", label: "Anxious" }
                ],
                "🐕"
              )}

              {renderRadioGroup(
                "Mood",
                "mood",
                [
                  { value: "happy", label: "Happy" },
                  { value: "neutral", label: "Neutral" },
                  { value: "sad", label: "Sad" },
                  { value: "stressed", label: "Stressed" }
                ],
                "😊"
              )}

              {renderRadioGroup(
                "Sleep Quality",
                "sleepQuality",
                [
                  { value: "poor", label: "Poor" },
                  { value: "normal", label: "Normal" },
                  { value: "good", label: "Good" }
                ],
                "😴"
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Additional Notes</h2>
            <div>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="input-field"
                placeholder="Any other observations, symptoms, or concerns..."
              />
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <Link to="/dashboard" className="flex-1 btn-secondary text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : '💾 Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
