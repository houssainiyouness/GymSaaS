import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  UI_AR_PATTERNS,
  UI_AR_TRANSLATIONS,
} from "../utils/uiArabicTranslations";

const TEXT_RECORDS = new WeakMap();
const ATTRIBUTE_RECORDS = new WeakMap();

const ATTRIBUTES = [
  "placeholder",
  "title",
  "aria-label",
];

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "NOSCRIPT",
]);

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function translateValue(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  if (UI_AR_TRANSLATIONS[normalized]) {
    return UI_AR_TRANSLATIONS[normalized];
  }

  for (const item of UI_AR_PATTERNS) {
    const match = normalized.match(item.regex);

    if (match) {
      return item.replace(...match);
    }
  }

  return null;
}

function shouldSkipElement(element) {
  if (!element) {
    return true;
  }

  if (SKIP_TAGS.has(element.tagName)) {
    return true;
  }

  return Boolean(
    element.closest?.("[data-no-auto-translate='true']"),
  );
}

function translateTextNode(node) {
  const parent = node.parentElement;

  if (!parent || shouldSkipElement(parent)) {
    return;
  }

  const currentValue = node.nodeValue || "";
  const existing = TEXT_RECORDS.get(node);

  if (existing && currentValue === existing.translated) {
    return;
  }

  const translated = translateValue(currentValue);

  if (!translated || translated === normalizeText(currentValue)) {
    return;
  }

  TEXT_RECORDS.set(node, {
    original: currentValue,
    translated,
  });

  node.nodeValue = translated;
}

function translateAttributes(element) {
  if (shouldSkipElement(element)) {
    return;
  }

  let records = ATTRIBUTE_RECORDS.get(element);

  if (!records) {
    records = new Map();
    ATTRIBUTE_RECORDS.set(element, records);
  }

  for (const attribute of ATTRIBUTES) {
    if (!element.hasAttribute(attribute)) {
      continue;
    }

    const currentValue = element.getAttribute(attribute) || "";
    const existing = records.get(attribute);

    if (existing && currentValue === existing.translated) {
      continue;
    }

    const translated = translateValue(currentValue);

    if (!translated || translated === normalizeText(currentValue)) {
      continue;
    }

    records.set(attribute, {
      original: currentValue,
      translated,
    });

    element.setAttribute(attribute, translated);
  }
}

function translateTree(root) {
  if (!root) {
    return;
  }

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateAttributes(root);
  }

  for (const child of root.childNodes) {
    translateTree(child);
  }
}

function restoreTree(root) {
  if (!root) {
    return;
  }

  if (root.nodeType === Node.TEXT_NODE) {
    const record = TEXT_RECORDS.get(root);

    if (record) {
      if (root.nodeValue === record.translated) {
        root.nodeValue = record.original;
      }

      TEXT_RECORDS.delete(root);
    }

    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    const records = ATTRIBUTE_RECORDS.get(root);

    if (records) {
      for (const [attribute, record] of records.entries()) {
        if (root.getAttribute(attribute) === record.translated) {
          root.setAttribute(attribute, record.original);
        }
      }

      ATTRIBUTE_RECORDS.delete(root);
    }
  }

  for (const child of root.childNodes) {
    restoreTree(child);
  }
}

function UiTranslationBridge() {
  const { i18n } = useTranslation();

  const language = String(
    i18n.resolvedLanguage || i18n.language || "fr",
  ).toLowerCase();

  useEffect(() => {
    const root = document.body;

    if (!root) {
      return undefined;
    }

    if (!language.startsWith("ar")) {
      restoreTree(root);
      return undefined;
    }

    translateTree(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target);
          continue;
        }

        if (mutation.type === "attributes") {
          translateAttributes(mutation.target);
          continue;
        }

        for (const node of mutation.addedNodes) {
          translateTree(node);
        }
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return null;
}

export default UiTranslationBridge;
