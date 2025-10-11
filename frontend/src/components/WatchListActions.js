import React from "react";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  MoreHoriz,
} from "@mui/icons-material";

const WatchListActions = ({ uid, generalContext }) => {
  const handleBuy = () => generalContext.openBuyWindow(uid);

  // Define tooltip props for consistent styling
  const tooltipProps = {
    componentsProps: {
      tooltip: {
        sx: {
          maxWidth: 200, // Set your desired maximum width
        },
      },
    },
  };

  return (
    <span className="actions">
      <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow} {...tooltipProps}>
        <button className="buy" onClick={handleBuy}>
          Buy
        </button>
      </Tooltip>
      <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow} {...tooltipProps}>
        <button className="sell">Sell</button>
      </Tooltip>
      <Tooltip title="Analytics (A)" placement="top" arrow TransitionComponent={Grow} {...tooltipProps}>
        <button className="action">
          <BarChartOutlined className="icon" />
        </button>
      </Tooltip>
      <Tooltip title="More" placement="top" arrow TransitionComponent={Grow} {...tooltipProps}>
        <button className="action">
          <MoreHoriz className="icon" />
        </button>
      </Tooltip>
    </span>
  );
};

export default WatchListActions;