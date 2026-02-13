import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Home from "./Pages/Home/Home";
import About from "./Pages/About/About";
import Privacy from "./Pages/Privacy/Privacy";
import Contact from "./Pages/Contact/Contact";

import Roulette from "./games/Roulette/Roulette";
import AviatorCrash from "./games/Aviator/AviatorCrash";

// placeholder imports for upcoming games
import LuckyDice from "./games/LuckyDice/LuckyDice";
import ChickenRoad from "./games/ChickenRoad/ChickenRoad";
import FrogRoad from "./games/FrogRoad/FrogRoad";
import JackPot777 from "./games/JackPot777/JackPot777";
import ThreePatti from "./games/ThreePatti/ThreePatti";
import Mines from "./games/Mines/Mines";
function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Header />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />

            {/* game routes */}
            <Route path="/games/roulette" element={<Roulette />} />
            <Route path="/games/Aviator-crash" element={<AviatorCrash />} />
            
            <Route path="/games/lucky-dice" element={<LuckyDice />} />
            <Route path="/games/chicken-road" element={<ChickenRoad />} />
            <Route path="/games/frog-road" element={<FrogRoad />} />
            <Route path="/games/jackpot-777" element={<JackPot777 />} />
            <Route path="/games/3-patti" element={<ThreePatti />} />
            <Route path="/games/mines" element={<Mines />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
