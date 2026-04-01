"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CodeGenOptions,
  DataFormat,
  EditorSide,
  OutputFormat,
  XmlOptions,
} from "../type";
import {
  createDownloadName,
  DEFAULT_CODE_GEN_OPTIONS,
  DEFAULT_XML_OPTIONS,
  detectDataFormatFromFileName,
  downloadTextFile,
  readTextFile,
  transformLeftToRight,
} from "../utils";

const DEFAULT_LEFT_FORMAT: DataFormat = "json";
const DEFAULT_RIGHT_FORMAT: OutputFormat = "yaml";
const DEFAULT_ROOT_TYPE_NAME = "RootModel";

/**
 * 数据转换工具的主状态与交互逻辑。
 */
function useDataConverter() {
  const [leftFormat, setLeftFormat] = useState<DataFormat>(DEFAULT_LEFT_FORMAT);
  const [rightFormat, setRightFormat] =
    useState<OutputFormat>(DEFAULT_RIGHT_FORMAT);
  const [leftValue, setLeftValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const [leftError, setLeftError] = useState("");
  const [rootTypeName, setRootTypeName] = useState(DEFAULT_ROOT_TYPE_NAME);
  const [xmlOptions, setXmlOptions] = useState<XmlOptions>(DEFAULT_XML_OPTIONS);
  const [codeGenOptions, setCodeGenOptions] = useState<CodeGenOptions>(
    DEFAULT_CODE_GEN_OPTIONS,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = transformLeftToRight({
        leftFormat,
        rightFormat,
        leftValue,
        rootTypeName,
        xmlOptions,
        codeGenOptions,
      });

      if (result.ok) {
        setLeftError("");
        setRightValue(result.value);
        return;
      }

      setLeftError(result.error);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    codeGenOptions,
    leftFormat,
    leftValue,
    rightFormat,
    rootTypeName,
    xmlOptions,
  ]);

  const updateLeftValue = useCallback((value: string) => {
    setLeftValue(value);
  }, []);

  const updateRightValue = useCallback((value: string) => {
    setRightValue(value);
  }, []);

  const changeLeftFormat = useCallback((format: DataFormat) => {
    setLeftFormat(format);
    setLeftValue("");
    setRightValue("");
    setLeftError("");
  }, []);

  const changeRightFormat = useCallback((format: OutputFormat) => {
    setRightFormat(format);
  }, []);

  const clearSide = useCallback((side: EditorSide) => {
    if (side === "left") {
      setLeftValue("");
      setRightValue("");
      setLeftError("");
      return;
    }

    setRightValue("");
  }, []);

  const copySide = useCallback(
    async (side: EditorSide) => {
      const value = side === "left" ? leftValue : rightValue;
      await navigator.clipboard.writeText(value);
      toast.success(side === "left" ? "左侧内容已复制" : "右侧内容已复制");
    },
    [leftValue, rightValue],
  );

  const downloadSide = useCallback(
    (side: EditorSide) => {
      const value = side === "left" ? leftValue : rightValue;
      const format = side === "left" ? leftFormat : rightFormat;

      downloadTextFile(createDownloadName(side, format), value);
      toast.success(side === "left" ? "已下载左侧内容" : "已下载右侧内容");
    },
    [leftFormat, leftValue, rightFormat, rightValue],
  );

  const uploadLeftFile = useCallback(async (file: File) => {
    try {
      const text = await readTextFile(file);
      const detectedFormat = detectDataFormatFromFileName(file.name);

      if (detectedFormat) {
        setLeftFormat(detectedFormat);
      }

      setLeftValue(text);
      setLeftError("");
      toast.success("文件已导入到左侧输入区");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "文件读取失败");
    }
  }, []);

  const value = useMemo(
    () => ({
      leftFormat,
      rightFormat,
      leftValue,
      rightValue,
      leftError,
      rootTypeName,
      xmlOptions,
      codeGenOptions,
      updateLeftValue,
      updateRightValue,
      changeLeftFormat,
      changeRightFormat,
      setRootTypeName,
      setXmlOptions,
      setCodeGenOptions,
      clearSide,
      copySide,
      downloadSide,
      uploadLeftFile,
    }),
    [
      changeLeftFormat,
      changeRightFormat,
      clearSide,
      copySide,
      downloadSide,
      leftError,
      leftFormat,
      leftValue,
      codeGenOptions,
      rightFormat,
      rightValue,
      rootTypeName,
      updateLeftValue,
      updateRightValue,
      uploadLeftFile,
      xmlOptions,
    ],
  );

  return value;
}

export default useDataConverter;

/**
 * 数据转换上下文类型。
 */
export type DataConverterContextValue = ReturnType<typeof useDataConverter>;
