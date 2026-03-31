"use client";

import type { FC } from "react";

import { useColorConverterContext } from "../hooks/useColorConverterContext";
import ColorFormatCard from "./color-format-card";

const FormatsPanel: FC = () => {
  const {
    cardData,
    color,
    commitModeInput,
    copyModeValue,
    draftValues,
    errors,
    pickerHexValue,
    updateDraftValue,
    updateModeChannel,
    updatePickerAlpha,
    updatePickerHex,
  } = useColorConverterContext();

  return (
    <div className="grid gap-4 lg:col-span-4 xl:grid-cols-2">
      {cardData.map((item) => (
        <ColorFormatCard
          alphaValue={color.alpha}
          data={item}
          draftValue={draftValues[item.mode]}
          error={errors[item.mode]}
          key={item.mode}
          onCommitInput={commitModeInput}
          onCopy={copyModeValue}
          onDraftChange={updateDraftValue}
          onPickerAlphaChange={updatePickerAlpha}
          onPickerHexChange={updatePickerHex}
          onUpdateChannel={updateModeChannel}
          pickerHexValue={pickerHexValue}
        />
      ))}
    </div>
  );
};

export default FormatsPanel;
