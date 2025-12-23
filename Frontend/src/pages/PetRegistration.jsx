import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PetRegistration() {
  const [petData, setPetData] = useState({
    name: "",
    type: "dog", // dog or cat
    breed: "",
    age: "",
    weight: "",
    gender: "male", // male or female
    color: "",
    microchipId: "",
    specialNotes: ""
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage("❌ Photo size should be less than 5MB");
        return;
      }
      
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append('userId', localStorage.getItem('userId'));
      formData.append('petData', JSON.stringify(petData));
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await fetch("http://localhost:5000/api/pets/register", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Pet registered successfully!");
        localStorage.setItem('petId', data.pet._id);
        localStorage.setItem('petName', data.pet.name);
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-100 mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Your Pet
          </h1>
          <p className="text-gray-600">
            Tell us about your furry friend
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Section */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pet Photo</h2>
            <div className="flex items-center space-x-6">
              <div className="shrink-0">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Pet preview" 
                    className="h-24 w-24 object-cover rounded-full"
                  />
                ) : (
                  <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-3xl text-gray-400">📷</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choose pet photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      cursor-pointer"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={petData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Max, Bella, Luna"
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={petData.type}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="dog">🐕 Dog</option>
                  <option value="cat">🐈 Cat</option>
                </select>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                  Breed
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  value={petData.breed}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Golden Retriever, Persian"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  id="age"
                  name="age"
                  value={petData.age}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 2 years, 6 months"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg/lbs)
                </label>
                <input
                  type="text"
                  id="weight"
                  name="weight"
                  value={petData.weight}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 25 kg, 55 lbs"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={petData.gender}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color/Markings
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={petData.color}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Brown with white spots"
                />
              </div>

              <div>
                <label htmlFor="microchipId" className="block text-sm font-medium text-gray-700 mb-1">
                  Microchip ID
                </label>
                <input
                  type="text"
                  id="microchipId"
                  name="microchipId"
                  value={petData.microchipId}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Optional microchip number"
                />
              </div>
            </div>
          </div>

          {/* Special Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div>
              <label htmlFor="specialNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Special Notes or Medical Conditions
              </label>
              <textarea
                id="specialNotes"
                name="specialNotes"
                value={petData.specialNotes}
                onChange={handleInputChange}
                rows={4}
                className="input-field"
                placeholder="Any allergies, medications, behavioral traits, or other important information..."
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
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 btn-secondary"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registering...' : 'Register Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}