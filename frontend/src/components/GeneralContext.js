import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BuyActionWindow from "./BuyActionWindow";

const GeneralContext = React.createContext({
  openBuyWindow: (uid, currentPrice) => {},
  closeBuyWindow: () => {},
  openSellWindow: (symbol, price) => {},
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [selectedStockPrice, setSelectedStockPrice] = useState(0);
  const navigate = useNavigate(); // ✅ Add this line

  const handleOpenBuyWindow = (uid, currentPrice = 0) => {
    setIsBuyWindowOpen(true);
    setSelectedStockUID(uid);
    setSelectedStockPrice(currentPrice);
  };

  const openSellWindow = (symbol, price) => {
    navigate('/jammu/sell', { 
      state: { symbol, price } 
    });
  };

  const handleCloseBuyWindow = () => {
    setIsBuyWindowOpen(false);
    setSelectedStockUID("");
    setSelectedStockPrice(0);
  };

  return (
    <GeneralContext.Provider
      value={{
        openSellWindow, // ✅ Now this will work
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
      }}
    >
      {props.children}
      {isBuyWindowOpen && (
        <BuyActionWindow 
          uid={selectedStockUID} 
          currentPrice={selectedStockPrice} 
        />
      )}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;