import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';

// =========================================================================
// ✅ यह एक सिमुलेटेड (नकली) बैकएंड API है।
//    हमने इसे एक ही फ़ाइल में बनाया है ताकि आप बिना किसी वास्तविक बैकएंड के
//    स्कूल और क्लास-आधारित क्वांटिटी सेट करने की कार्यक्षमता को देख सकें।
// =========================================================================

const mockDatabase = {
  schools: [
    { _id: 'school1', name: 'Delhi Public School' },
    { _id: 'school2', name: 'Kendriya Vidyalaya' },
    { _id: 'school3', name: 'Sunrise Public School' },
  ],
  classes: [
    { _id: 'class1', name: 'Class 1', schoolId: 'school1' },
    { _id: 'class2', name: 'Class 2', schoolId: 'school1' },
    { _id: 'class3', name: 'Class 3', schoolId: 'school1' },
    { _id: 'class4', name: 'Class 1', schoolId: 'school2' },
    { _id: 'class5', name: 'Class 2', schoolId: 'school2' },
    { _id: 'class6', name: 'Class 1', schoolId: 'school3' },
  ],
  books: [
    { _id: 'book1', name: 'Maths Book (Class 1)', author: 'Author A', schoolId: 'school1', classId: 'class1' },
    { _id: 'book2', name: 'English Reader (Class 1)', author: 'Author B', schoolId: 'school1', classId: 'class1' },
    { _id: 'book3', name: 'Science Book (Class 2)', author: 'Author C', schoolId: 'school1', classId: 'class2' },
    { _id: 'book4', name: 'Social Studies (Class 3)', author: 'Author D', schoolId: 'school1', classId: 'class3' },
    { _id: 'book5', name: 'Maths Book (KV Class 1)', author: 'Author E', schoolId: 'school2', classId: 'class4' },
    { _id: 'book6', name: 'Hindi Vyakaran (KV Class 2)', author: 'Author F', schoolId: 'school2', classId: 'class5' },
    { _id: 'book7', name: 'General Knowledge (SPS Class 1)', author: 'Author G', schoolId: 'school3', classId: 'class6' },
    { _id: 'book8', name: 'Art Book (SPS Class 1)', author: 'Author H', schoolId: 'school3', classId: 'class6' },
  ]
};

const api = {
  // ✅ GET method अब स्कूल और क्लास ID के आधार पर डेटा देता है।
  get: async (url, params) => {
    console.log(`Mock API: GET request to ${url} with params:`, params);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (url === '/schools') {
      return { data: { data: mockDatabase.schools } };
    }
    if (url === '/classes' && params?.schoolId) {
      return {
        data: {
          data: mockDatabase.classes.filter(c => c.schoolId === params.schoolId)
        }
      };
    }
    if (url === '/book-catalog' && params?.classId) {
      return {
        data: {
          data: mockDatabase.books.filter(b => b.classId === params.classId)
        }
      };
    }
    return { data: { data: [] } };
  },
  
  // ✅ POST method अब स्कूल/क्लास के लिए क्वांटिटी सेट करने को संभालता है।
  post: async (url, data) => {
    console.log(`Mock API: POST request to ${url} with data:`, data);
    await new Promise(resolve => setTimeout(resolve, 500));

    // सिंगल आइटम के लिए क्वांटिटी सेट करें
    if (url === '/stock/set-quantity') {
      return {
        data: {
          success: true,
          message: `Item ID ${data.itemId} ke liye quantity set ki gayi: ${data.quantity}.`,
        },
      };
    }

    // किसी स्कूल की सभी कक्षाओं के लिए क्वांटिटी सेट करें
    if (url === '/stock/set-all-quantity-for-school-classes') {
      return {
        data: {
          success: true,
          message: `School ID ${data.schoolId} ki sabhi classes ke liye quantity set ki gayi: ${data.quantity}.`,
        },
      };
    }
    
    return { data: { success: false, message: 'Unknown API endpoint.' } };
  }
};

// ToggleSwitch component पहले की तरह है
const ToggleSwitch = ({ isOn, onToggle }) => {
  const toggleClasses = `
    w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out
    ${isOn ? 'bg-indigo-600' : 'bg-gray-300'}
  `;
  const toggleBallClasses = `
    bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out
    ${isOn ? 'translate-x-6' : 'translate-x-0'}
  `;
  return (
    <div className={toggleClasses} onClick={onToggle} role="button" tabIndex="0" aria-checked={isOn}>
      <div className={toggleBallClasses}></div>
    </div>
  );
};


const SetQuantityPage = () => {
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [items, setItems] = useState([]);
  
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // ✅ यह टॉगल अब 'single item' या 'school की सभी classes' के बीच स्विच करेगा
  const [isSettingAll, setIsSettingAll] = useState(false);

  // सभी स्कूलों को fetch करने के लिए
  const fetchSchools = useCallback(async () => {
    try {
      const response = await api.get('/schools');
      setSchools(response.data.data);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
      setError('Schools load karne mein asafal raha.');
    }
  }, []);

  // चयनित स्कूल के आधार पर कक्षाओं को fetch करने के लिए
  const fetchClasses = useCallback(async () => {
    if (!selectedSchool) {
      setClasses([]);
      setSelectedClass('');
      return;
    }
    try {
      const response = await api.get('/classes', { schoolId: selectedSchool });
      setClasses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedClass(response.data.data[0]._id);
      } else {
        setSelectedClass('');
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError('Classes load karne mein asafal raha.');
    }
  }, [selectedSchool]);

  // चयनित कक्षा के आधार पर आइटम्स को fetch करने के लिए
  const fetchItems = useCallback(async () => {
    if (!selectedClass) {
      setItems([]);
      setSelectedItem('');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/book-catalog', { classId: selectedClass });
      setItems(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedItem(response.data.data[0]._id);
      } else {
        setSelectedItem('');
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Items load karne mein asafal raha. Kripya phir se prayas karein.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSetQuantity = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccessMessage('');

    if (!quantity || isNaN(parseInt(quantity, 10))) {
      setError('Kripya ek valid quantity darj karein.');
      setIsUpdating(false);
      return;
    }

    try {
      let response;
      if (isSettingAll) {
        if (!selectedSchool) {
          setError('Kripya ek school chunein.');
          setIsUpdating(false);
          return;
        }
        // ✅ अब सभी classes के लिए quantity सेट करने के लिए एक नया API endpoint
        response = await api.post('/stock/set-all-quantity-for-school-classes', {
          schoolId: selectedSchool,
          quantity: parseInt(quantity, 10),
        });
      } else {
        if (!selectedItem) {
          setError('Kripya ek item chunein.');
          setIsUpdating(false);
          return;
        }
        // ✅ सिंगल आइटम के लिए quantity सेट करने के लिए पुराना endpoint
        response = await api.post('/stock/set-quantity', {
          itemId: selectedItem,
          quantity: parseInt(quantity, 10),
        });
      }

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        toast.success(response.data.message);
        setQuantity('');
      } else {
        toast.error(response.data.message);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error setting quantity:', err);
      toast.error('Quantity set karne mein asafal raha. Kripya phir se prayas karein.');
      setError('Quantity set karne mein asafal raha. Kripya apna network check karein aur phir se prayas karein.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-right" richColors />
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Item Quantity Set Karein</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <div className="flex items-center justify-end mb-4 text-gray-600">
          <span className="mr-2 text-sm font-medium">Quantity set karein {isSettingAll ? 'School ki sabhi Classes ke liye' : 'Single Item ke liye'}</span>
          <ToggleSwitch isOn={isSettingAll} onToggle={() => setIsSettingAll(!isSettingAll)} />
        </div>

        <form onSubmit={handleSetQuantity} className="space-y-4">
          {/* ✅ School selection dropdown */}
          <div className="mt-4">
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
              School Chunein
            </label>
            <select
              id="school"
              name="school"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            >
              <option value="" disabled>-- Ek school chunein --</option>
              {schools.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Class selection dropdown (conditionally rendered) */}
          {!isSettingAll && (
            <div className="mt-4">
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                Class Chunein
              </label>
              <select
                id="class"
                name="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                required
              >
                <option value="" disabled>-- Ek class chunein --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ✅ Item selection dropdown (conditionally rendered) */}
          {!isSettingAll && (
            <div>
              <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                Item Chunein
              </label>
              {isLoading ? (
                <p className="text-gray-500">Items load ho rahe hain...</p>
              ) : (
                <select
                  id="item"
                  name="item"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  required
                >
                  <option value="" disabled>-- Ek item chunein --</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="Quantity darj karein"
              min="0"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {successMessage && <p className="text-green-600 text-sm mt-2">{successMessage}</p>}
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isUpdating}
          >
            {isUpdating ? 'Set ho raha hai...' : `Quantity Set karein ${isSettingAll ? 'School ke liye' : 'Chune hue ke liye'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetQuantityPage;
