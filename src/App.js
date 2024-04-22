import { useState } from "react";
import logo from './assets/logo.png';
// Local
import { generateCreationOnLuma, getTaskStatusOnLuma, convertToSTL } from "./service";
import { TOY_CATEGORIES, TOY_COLORS, TOY_MATERIALS, getToyGenerationPrompt } from "./constants";
const { GoogleGenerativeAI } = require("@google/generative-ai")
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
//const Geminiclient = new OpenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY, dangerouslyAllowBrowser: true });

function CateogryPickerComponent({ selectedCategory, setSelectedCategory }) {
  return (
    <div>
      <label htmlFor="category">Toy Category:&nbsp;</label>
      <select id="category" value={selectedCategory} className="mt-2 rounded border" onChange={e => setSelectedCategory(e.target.value)}>
        {TOY_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorPickerComponent({ selectedColor, setSelectedColor }) {
  return (
    <div>
      <label htmlFor="color">Toy Color:&nbsp;</label>
      <select id="color" value={selectedColor} className="mt-2 rounded border" onChange={e => setSelectedColor(e.target.value)}>
        {TOY_COLORS.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
    </div>
  );
}

function MaterialPickerComponent({ selectedMaterial, setSelectedMaterial }) {
  return (
    <div>
      <label htmlFor="material">Toy Material:&nbsp;</label>
      <select id="material" value={selectedMaterial} className="mt-2 rounded border" onChange={e => setSelectedMaterial(e.target.value)}>
        {TOY_MATERIALS.map((material) => (
          <option key={material} value={material}>
            {material}
          </option>
        ))}
      </select>
    </div>
  );
}

function CustomizeToyComponent({ toySize, setToySize, toyAgeRange, setToyAgeRange, toyCustomization, setToyCustomization, customizeName, setCustomizeName }) {
  return (
    <div className="mt-8">
      <label className="block">
        Toy Size in cm: {toySize}&nbsp;&nbsp;
        <input type="range" min="10" max="100" value={toySize} onChange={(e) => setToySize(e.target.value)} className="slider" />
      </label>
      <br />

      <label className="block">
        Toy Age Range: {toyAgeRange.min} - {toyAgeRange.max}&nbsp;&nbsp;
        <input type="range" min="1" max="18" value={toyAgeRange.min} onChange={(e) => setToyAgeRange({ ...toyAgeRange, min: e.target.value })} className="slider" />
        <input type="range" min="1" max="18" value={toyAgeRange.max} onChange={(e) => setToyAgeRange({ ...toyAgeRange, max: e.target.value })} className="slider" />
      </label>
      <br />

      <label className="block">
        <input type="checkbox" checked={toyCustomization} onChange={() => setToyCustomization(!toyCustomization)} />
        &nbsp;&nbsp;Customize Toy
      </label>
      <br />

      {toyCustomization && (
        <label className="block">
          Describe your Customization
          <input
            type="text"
            value={customizeName}
            onChange={(e) => setCustomizeName(e.target.value)} className="form-input mt-1 block w-full rounded border border-black" />
        </label>
      )}
    </div>
  );
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState(TOY_CATEGORIES[0]);
  const [selectedColor, setSelectedColor] = useState(TOY_COLORS[0]);
  const [selectedMaterial, setSelectedMaterial] = useState(TOY_MATERIALS[0]);

  const [toySize, setToySize] = useState(10);
  const [toyAgeRange, setToyAgeRange] = useState({ min: 3, max: 12 });
  const [toyCustomization, setToyCustomization] = useState(false);
  const [customizeName, setCustomizeName] = useState('');
  // Loaders
  const [textLoading, setTextLoading] = useState(false);
  const [modelLoadingProgess, setModelLoadingProgress] = useState(null);
  // Assets
  const [textOutput, setTextOutput] = useState(null);
  const [modelUrl, setModelUrl] = useState("");
  const [taskId, setTaskId] = useState(null);

  async function generate3dModel() {
    setModelLoadingProgress("running");
    const taskId = await generateCreationOnLuma(textOutput);
    setTaskId(taskId);

    const interval = setInterval(async () => {
      const { output, status } = await getTaskStatusOnLuma(taskId);
      setModelLoadingProgress(status);
      if (status === "completed") {
        clearInterval(interval);
        setModelUrl(output);
        setModelLoadingProgress(null);
        setTaskId(taskId);
      }
    }, 5000);
  }

  async function onGenerateToyTextButtonClick() {
    setTextLoading(true);
    try {
      const prompt = getToyGenerationPrompt(
        selectedCategory,
        selectedColor,
        selectedMaterial,
        toySize,
        toyAgeRange,
        toyCustomization,
        customizeName
      );
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const output = response.text();
      setTextOutput(output);
    } catch (error) {
      alert(error);
    }
    finally {
      setTextLoading(false);
    }
  }

  async function onDownloadModelButtonClick() {
    const stlModelUrl = await convertToSTL(taskId);
    window.open(stlModelUrl, "_blank");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen mx-auto p-4 text-gray-900 soft-dynamic-gradient">
      <img src={logo} alt="Toys.ai Logo" className="w-32 mb-4" />
      <h1 className="text-4xl font-bold mb-2">toys.ai</h1>
      <h3 className="text-2xl mb-2">Get your customized toys with AI!</h3>
      <h3 className="text-xl mb-6">Select from the options below to get started</h3>

      <CateogryPickerComponent
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory} />

      <ColorPickerComponent
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor} />

      <MaterialPickerComponent
        selectedMaterial={selectedMaterial}
        setSelectedMaterial={setSelectedMaterial} />

      <CustomizeToyComponent
        toySize={toySize}
        setToySize={setToySize}
        toyAgeRange={toyAgeRange}
        setToyAgeRange={setToyAgeRange}
        toyCustomization={toyCustomization}
        setToyCustomization={setToyCustomization}
        customizeName={customizeName}
        setCustomizeName={setCustomizeName} />

      <button
        type="submit"
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
        onClick={textLoading ? null : onGenerateToyTextButtonClick}
        disabled={textLoading}
        style={{ backgroundColor: textLoading ? 'LightGray' : 'DodgerBlue' }}
      >
        {textLoading ? 'Generating toy description...' : 'Generate Toy Description'}
      </button>

      <p className="w-full text-center text-xl mt-4">{textOutput}</p>

      <br />
      {textOutput &&
        <button
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
          onClick={modelLoadingProgess ? null : generate3dModel}
          style={{ backgroundColor: modelLoadingProgess ? 'LightGray' : 'DodgerBlue' }}
        >
          {modelLoadingProgess ? 'Generating 3D model...' : 'Generate 3D Model'}
        </button>
      }

      {
        modelUrl.length > 0 && taskId &&
        <span onClick={onDownloadModelButtonClick} className="mt-2 block underline hover:cursor-pointer">Download 3D Model</span>
      }
      <br />

      {
        modelUrl.length > 0 &&
        <model-viewer
          alt="Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum"
          src={modelUrl}
          ar
          shadow-intensity="1"
          camera-controls touch-action="pan-y"
          style={{ width: "100%", height: "500px" }}
        >
        </model-viewer>
      }
    </div >
  );
}

export default App;
