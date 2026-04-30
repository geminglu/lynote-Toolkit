"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "lynote-ui/combobox";
import type { FC } from "react";

import type { DiffLanguageOption } from "../type";

/**
 * 语法高亮搜索选择器属性。
 */
export type LanguageComboboxProps = {
  /**
   * 当前选中的 Monaco language id。
   */
  value: string;
  /**
   * 可选择的 Monaco 语言列表。
   */
  options: DiffLanguageOption[];
  /**
   * 选择语言后触发的回调。
   */
  onChange: (value: string) => void;
};

/**
 * 可搜索的语法高亮选择器。
 *
 * Base UI Combobox 会在服务端和客户端生成内部 id 与状态属性。该组件通过
 * `next/dynamic({ ssr: false })` 在父组件中仅客户端渲染，避免 hydration mismatch。
 */
const LanguageCombobox: FC<LanguageComboboxProps> = ({
  value,
  options,
  onChange,
}) => {
  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  return (
    <Combobox<DiffLanguageOption>
      autoHighlight
      items={options}
      onValueChange={(option) => {
        if (!option) {
          return;
        }

        onChange(option.value);
      }}
      value={selectedOption}
    >
      <ComboboxInput
        id="diff-language"
        aria-label="语法高亮"
        className="w-48"
        placeholder="搜索语言"
      />
      <ComboboxContent>
        <ComboboxEmpty>没有匹配的语言</ComboboxEmpty>
        <ComboboxList>
          {(option: DiffLanguageOption, index: number) => (
            <ComboboxItem index={index} key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default LanguageCombobox;
