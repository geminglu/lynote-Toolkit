"use client";

import {
  Combobox,
  ComboboxCollection,
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
      filter={(option, query) => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
          return true;
        }

        return (
          option.label.toLowerCase().includes(normalizedQuery) ||
          option.value.toLowerCase().includes(normalizedQuery)
        );
      }}
      items={options}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(itemValue, selectedValue) =>
        itemValue.value === selectedValue.value
      }
      onValueChange={(option) => {
        if (!option) {
          return;
        }

        onChange(option.value);
      }}
      value={selectedOption}
    >
      <ComboboxInput
        aria-label="语法高亮"
        className="w-48"
        placeholder="搜索语言"
      />
      <ComboboxContent>
        <ComboboxEmpty>没有匹配的语言</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(option: DiffLanguageOption, index: number) => (
              <ComboboxItem index={index} key={option.value} value={option}>
                <span>{option.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {option.value}
                </span>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default LanguageCombobox;
