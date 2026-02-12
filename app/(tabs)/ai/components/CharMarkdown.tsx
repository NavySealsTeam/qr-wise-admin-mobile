import React, { useMemo } from 'react';
import { Linking, Text, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

const allowedProtocols = new Set(['http:', 'https:', 'mailto:']);

function toSafeUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/') || url.startsWith('#')) return url; // keep same behavior as web

  try {
    const parsed = new URL(url);
    return allowedProtocols.has(parsed.protocol) ? url : '';
  } catch {
    return '';
  }
}

function isExternalUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
}

export default function ChatMarkdown({ content }: { content: string }) {
  // Enable some GFM-like behavior (tables, strikethrough)
  // Task lists: react-native-markdown-display supports them via markdown-it plugins depending on version.
  // We'll also add custom rendering for task list items below.
  const md = useMemo(() => {
    const m = MarkdownIt({ typographer: true, linkify: true });
    // Most builds already include tables/strikethrough; if yours doesn’t, keep this anyway.
    // (react-native-markdown-display internally uses markdown-it.)
    return m;
  }, []);

  return (
    <Markdown
      markdownit={md}
      // same idea as skipHtml
      rules={{
        // Disable HTML entirely (closest to skipHtml)
        html_block: () => null,
        html_inline: () => null,

        // Link: apply safe URL + open with Linking
        link: (node, children, parent, styles) => {
          const rawHref = (node.attributes?.href as string) || '';
          const href = toSafeUrl(rawHref) || '#';
          const isSafe = href !== '#' && (href.startsWith('/') || href.startsWith('#') || isExternalUrl(href));

          return (
            <Text
              key={node.key}
              style={styles.link}
              onPress={() => {
                if (!isSafe) return;
                // For in-app routes like "/foo", you can hook this to expo-router instead.
                if (href.startsWith('/') || href.startsWith('#')) return;
                Linking.openURL(href).catch(() => {});
              }}>
              {children}
            </Text>
          );
        },

        // Inline code
        code_inline: (node, children, parent, styles) => (
          <Text key={node.key} style={styles.code_inline}>
            {node.content}
          </Text>
        ),

        // Code block (fenced)
        fence: (node, children, parent, styles) => (
          <View key={node.key} style={styles.pre}>
            <Text style={styles.code_block}>{node.content}</Text>
          </View>
        ),

        // Indented code block
        code_block: (node, children, parent, styles) => (
          <View key={node.key} style={styles.pre}>
            <Text style={styles.code_block}>{node.content}</Text>
          </View>
        ),

        // Blockquote container
        blockquote: (node, children, parent, styles) => (
          <View key={node.key} style={styles.blockquote}>
            {children}
          </View>
        ),

        // Task list checkbox (GFM)
        // react-native-markdown-display emits "checkbox" nodes when task lists are parsed
        checkbox: (node, children, parent, styles) => {
          const checked = !!node.attributes?.checked;
          return (
            <Text
              key={node.key}
              style={[styles.checkbox, checked ? styles.checkbox_checked : styles.checkbox_unchecked]}>
              {checked ? '☑' : '☐'}{' '}
            </Text>
          );
        },

        // Tables: many versions support table nodes; styling is via styles.table / th / td below.
        // If your version doesn’t render tables, tell me your package version and I’ll patch with a table plugin.
      }}
      style={{
        // Base text
        body: {
          color: 'rgba(255,255,255,0.8)', // #FFFFFFCC
          fontSize: 14,
          lineHeight: 24, // ~170%
        },

        // Paragraphs
        paragraph: {
          marginTop: 0,
          marginBottom: 10,
        },

        // Headings
        heading1: {
          color: '#FFFFFF',
          fontSize: 20,
          lineHeight: 30,
          fontWeight: '700',
          marginTop: 8,
          marginBottom: 6,
        },
        heading2: {
          color: '#FFFFFF',
          fontSize: 18,
          lineHeight: 27,
          fontWeight: '700',
          marginTop: 8,
          marginBottom: 6,
        },
        heading3: {
          color: '#FFFFFF',
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '700',
          marginTop: 8,
          marginBottom: 6,
        },

        // Lists
        bullet_list: {
          marginLeft: 18,
          marginVertical: 6,
        },
        ordered_list: {
          marginLeft: 18,
          marginVertical: 6,
        },
        list_item: {
          marginVertical: 4, // like space-y-2
        },

        // Blockquote
        blockquote: {
          borderLeftWidth: 2,
          borderLeftColor: '#4D4D4D',
          paddingLeft: 12,
          marginVertical: 6,
          backgroundColor: '#ef4444',
        },

        // Links
        link: {
          color: '#00FFFF',
          textDecorationLine: 'underline',
        },

        // Code
        pre: {
          marginVertical: 8, // like <div className="my-2">
        },
        code_block: {
          backgroundColor: '#1A1A1A',
          borderRadius: 10,
          padding: 12,
          color: '#FFFFFF',
          fontSize: 12,
          lineHeight: 18,
          // Note: RN doesn’t always support horizontal scroll inside Text.
          // If you need horizontal scrolling for long lines, I can wrap this in a horizontal ScrollView.
        },
        code_inline: {
          backgroundColor: '#1A1A1A',
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 2,
          color: '#FFFFFF',
          fontSize: 12,
        },

        // Tables (best-effort; depends on parser support)
        table: {
          borderWidth: 1,
          borderColor: '#4D4D4D',
          borderRadius: 10,
          overflow: 'hidden',
          marginVertical: 8,
        },
        thead: {
          backgroundColor: '#1A1A1A',
        },
        th: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#4D4D4D',
        },
        td: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#4D4D4D',
        },

        // Checkbox (task list)
        checkbox: {
          color: '#00FFFF',
        },
        checkbox_checked: {},
        checkbox_unchecked: {},
      }}>
      {content}
    </Markdown>
  );
}
