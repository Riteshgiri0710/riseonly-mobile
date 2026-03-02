import { changeRgbA } from '@lib/theme';
import { useObserver } from 'mobx-react-lite';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
	StyleSheet,
	TextInputProps,
	View
} from 'react-native';
import WebView from 'react-native-webview';
import { commentInteractionsStore } from 'src/modules/comment/stores';
import { themeStore } from 'src/modules/theme/stores';

declare module 'react-native-webview' {
	interface WebView {
		isFocused?: boolean;
	}
}

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 100;

interface LexicalRichTextInputProps extends Omit<TextInputProps, 'multiline' | 'onChange'> {
	value: string;
	forceRenderFormatted?: boolean;
	onChangeText?: (text: string) => void;
	onSelectionChange?: (e: any) => void;
	onContentSizeChange?: (e: any) => void;
	minHeight?: number;
	maxHeight?: number;
	rawText?: string;
	setText?: (text: string) => void;
	setRawText?: (text: string) => void;
	text?: string;
}

export interface LexicalRichTextInputRef {
	focus: () => void;
	setNativeProps: (props: any) => void;
	insertHTML: (html: string) => void;
	setContentHTML: (html: string) => void;
	setBold: () => void;
	setItalic: () => void;
	setUnderline: () => void;
	setTextColor: (color: string) => void;
	removeFormat: () => void;
	moveCursorToEnd: () => void;
	editor: React.RefObject<WebView>;
	blur: () => void;
	increaseIndent: () => void;
	decreaseIndent: () => void;
	insertCode: (language?: string) => void;
}

export const InputRegistryContext = React.createContext<{
	registerInput?: (ref: any) => void;
}>({});

export const LexicalRichTextInput = forwardRef<LexicalRichTextInputRef, LexicalRichTextInputProps>(
	({
		value,
		style,
		onChangeText,
		onSelectionChange,
		onContentSizeChange,
		placeholder,
		placeholderTextColor,
		minHeight = MIN_HEIGHT,
		maxHeight = MAX_HEIGHT,
		rawText,
		setText,
		setRawText,
		text,
		...props
	}, ref) => {
		const editorRef = useRef<WebView>(null);
		const [lastValue, setLastValue] = useState('');
		const [isFormatting, setIsFormatting] = useState(false);
		const [editorHeight, setEditorHeight] = useState(minHeight);
		const [editorReady, setEditorReady] = useState(false);
		const [pendingFocus, setPendingFocus] = useState(false);
		const [userInteracting, setUserInteracting] = useState(false);
		const userInteractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		const isVisible = useObserver(() => commentInteractionsStore.isInputsVisible);

		const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              box-sizing: border-box;
              -webkit-user-select: auto;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              overflow: hidden;
              background-color: transparent;
              font-family: -apple-system, sans-serif;
            }
            
            #editor {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              padding: 7px 5px 7px 10px;
              font-size: 14.5px;
              color: ${String(themeStore.currentTheme.text_100)};
              min-height: ${minHeight}px;
              max-height: ${maxHeight}px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              outline: none;
              caret-color: ${String(themeStore.currentTheme.text_100)};
            }
            
            #editor:empty:before {
              content: "${placeholder}";
              color: ${String(placeholderTextColor || themeStore.currentTheme.secondary_100)};
              position: absolute;
              pointer-events: none;
            }
            
            .bold { font-weight: bold; }
            .italic { font-style: italic; }
            .underline { text-decoration: underline; }
            
            .code-container {
              position: relative;
              margin: 10px 0;
            }
            
            .code-block {
              background-color: ${changeRgbA(themeStore.currentTheme.primary_100, "0.1")};
              padding: 25px 10px 10px 15px;
              border-radius: 5px;
              font-family: monospace;
              font-size: 10px;
              overflow-x: auto;
              margin: 5px 0;
              border: none;
              border-left: 3px solid ${String(themeStore.currentTheme.primary_100)} !important;
              white-space: pre;
              line-height: 1.5;
            }
            
            .language-label {
              position: absolute;
              top: 5px;
              left: 5px;
              color: ${String(themeStore.currentTheme.primary_100)};
              padding: 0px 5px;
              font-size: 10px;
              background-color: transparent;
            }
            
            .copy-button {
              position: absolute;
              top: 5px;
              right: 5px;
              background-color: rgba(0, 0, 0, 0.5);
              color: ${String(themeStore.currentTheme.primary_100)};
              width: 24px;
              height: 24px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              opacity: 0.8;
              transition: all 0.2s ease;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border: 1px solid rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div id="editor" contenteditable="true" spellcheck="false"></div>
          
          <script>
            const editor = document.getElementById('editor');
            
            const initialContent = ${JSON.stringify(text || value || '')};
            if (initialContent) {
              editor.innerHTML = initialContent;
            }
            
            let isUserEditing = false;
            let lastUserInteraction = 0;
            let lastSyncedContent = editor.innerHTML;
            
            function updateHeight() {
              const height = Math.min(${maxHeight}, Math.max(${minHeight}, editor.scrollHeight));
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contentHeight',
                height: height
              }));
            }
            
            function syncContent() {
              lastUserInteraction = Date.now();
              isUserEditing = true;
              
              const currentContent = editor.innerHTML;
              if (currentContent !== lastSyncedContent) {
                lastSyncedContent = currentContent;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'content',
                  html: currentContent,
                  text: editor.innerText
                }));
              }
            }
            
            // Только базовые обработчики
            editor.addEventListener('input', () => {
              updateHeight();
              syncContent();
            });
            
            // Отслеживание фокуса и взаимодействия
            editor.addEventListener('focus', () => {
              isUserEditing = true;
              lastUserInteraction = Date.now();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'focus'
              }));
            });
            
            editor.addEventListener('blur', () => {
              // Небольшая задержка перед сбросом флага редактирования
              setTimeout(() => {
                isUserEditing = false;
              }, 500);
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'blur'
              }));
            });
            
            // Дополнительные события для отслеживания взаимодействия пользователя
            editor.addEventListener('mousedown', () => {
              isUserEditing = true;
              lastUserInteraction = Date.now();
            });
            
            editor.addEventListener('keydown', () => {
              isUserEditing = true;
              lastUserInteraction = Date.now();
            });
            
            editor.addEventListener('touchstart', () => {
              isUserEditing = true;
              lastUserInteraction = Date.now();
            });
            
            // API для форматирования
            window.editorAPI = {
              setContent: (html, forceUpdate = false) => {
                // КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Не обновляем контент, если пользователь недавно взаимодействовал с редактором
                // Это предотвращает перемещение курсора при вводе
                const timeSinceLastInteraction = Date.now() - lastUserInteraction;
                
                if (!forceUpdate && (isUserEditing || timeSinceLastInteraction < 2000)) {
                  console.log('Skipping content update during user interaction');
                  return;
                }
                
                // Если обновление разрешено, просто устанавливаем новое содержимое
                editor.innerHTML = html;
                lastSyncedContent = html;
                updateHeight();
              },
              
              insertHTML: (html) => {
                document.execCommand('insertHTML', false, html);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              focus: () => {
                editor.focus();
              },
              
              blur: () => {
                editor.blur();
              },
              
              setBold: () => {
                document.execCommand('bold', false, null);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              setItalic: () => {
                document.execCommand('italic', false, null);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              setUnderline: () => {
                document.execCommand('underline', false, null);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              setTextColor: (color) => {
                document.execCommand('foreColor', false, color);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              removeFormat: () => {
                document.execCommand('removeFormat', false, null);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              increaseIndent: () => {
                document.execCommand('indent', false, null);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              decreaseIndent: () => {
                document.execCommand('outdent', false, null);
                lastSyncedContent = editor.innerHTML;
                updateHeight();
              },
              
              moveCursorToEnd: () => {
                const range = document.createRange();
                const selection = window.getSelection();
                
                if (editor.lastChild) {
                  if (editor.lastChild.nodeType === Node.TEXT_NODE) {
                    range.setStart(editor.lastChild, editor.lastChild.textContent.length);
                  } else {
                    range.setStartAfter(editor.lastChild);
                  }
                } else {
                  range.setStart(editor, 0);
                }
                
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Отмечаем взаимодействие пользователя
                lastUserInteraction = Date.now();
              },
              
              insertCode: (language) => {
                const selection = window.getSelection();
                const selectedText = selection.toString() || '';
                
                const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);
                
                const codeHtml = \`
                  <div class="code-container">
                    <pre class="code-block language-\${language}">
                      <code>\${selectedText}</code>
                    </pre>
                    <div class="language-label">\${langDisplay}</div>
                    <div class="copy-button">
                      <svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
                      </svg>
                    </div>
                  </div>
                \`;
                
                document.execCommand('insertHTML', false, codeHtml);
                lastSyncedContent = editor.innerHTML;
                
                // Setup copy buttons
                document.querySelectorAll('.copy-button').forEach(button => {
                  button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const codeBlock = this.closest('.code-container').querySelector('code');
                    if (codeBlock) {
                      const text = codeBlock.innerText;
                      
                      const textarea = document.createElement('textarea');
                      textarea.value = text;
                      textarea.style.position = 'fixed';
                      textarea.style.opacity = '0';
                      document.body.appendChild(textarea);
                      textarea.select();
                      
                      try {
                        document.execCommand('copy');
                        this.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>';
                        
                        setTimeout(() => {
                          this.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
                        }, 1500);
                      } catch (err) {
                        console.error('Failed to copy text:', err);
                      }
                      
                      document.body.removeChild(textarea);
                    }
                  });
                });
                
                updateHeight();
                
                // Отмечаем взаимодействие пользователя
                lastUserInteraction = Date.now();
              }
            };
            
            // Инициализация
            updateHeight();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ready'
            }));
            
            // Установка начального фокуса
            editor.focus();
          </script>
        </body>
      </html>
    `;

		useEffect(() => {
			if (editorRef.current) {
				commentInteractionsStore.registerInput(editorRef.current);
			}

			return () => {
				if (editorRef.current) {
					commentInteractionsStore.unregisterInput(editorRef.current);
				}
			};
		}, []);

		// Простая функция для фокусировки
		const forceFocus = () => {
			if (editorRef.current && editorReady) {
				editorRef.current.injectJavaScript(`
          editor.focus();
          true;
        `);
			}
		};

		// Эффект для восстановления фокуса
		useEffect(() => {
			if (pendingFocus && editorReady) {
				forceFocus();
				setPendingFocus(false);
			}
		}, [pendingFocus, editorReady]);

		useImperativeHandle(ref, () => ({
			focus: () => {
				if (editorReady) {
					forceFocus();
				} else {
					setPendingFocus(true);
				}
			},
			setNativeProps: (props: any) => {
				if (props.selection && editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.setContent(${JSON.stringify(value)});
            true;
          `);
				}
			},
			insertHTML: (html: string) => {
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.insertHTML(${JSON.stringify(html)});
            true;
          `);
				}
			},
			setContentHTML: (html: string) => {
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.setContent(${JSON.stringify(html)});
            true;
          `);
				}
			},
			setBold: () => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.setBold();
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			setItalic: () => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.setItalic();
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			setUnderline: () => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.setUnderline();
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			setTextColor: (color: string) => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.setTextColor(${JSON.stringify(color)});
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			removeFormat: () => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.removeFormat();
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			moveCursorToEnd: () => {
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.moveCursorToEnd();
            true;
          `);
				}
			},
			editor: editorRef as React.RefObject<WebView>,
			blur: () => {
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.blur();
            true;
          `);
				}
			},
			increaseIndent: () => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.increaseIndent();
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			decreaseIndent: () => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.decreaseIndent();
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			},
			insertCode: (language = 'python') => {
				setIsFormatting(true);
				if (editorRef.current && editorReady) {
					editorRef.current.injectJavaScript(`
            window.editorAPI.insertCode(${JSON.stringify(language)});
            true;
          `);
				}
				setTimeout(() => {
					setIsFormatting(false);
				}, 100);
			}
		}));

		// Обработка сообщений от WebView
		const handleMessage = (event: any) => {
			try {
				const data = JSON.parse(event.nativeEvent.data);

				if (data.type === 'ready') {
					setEditorReady(true);
					if (pendingFocus) {
						forceFocus();
						setPendingFocus(false);
					}
				} else if (data.type === 'content') {
					const { html, text: rawTextContent } = data;

					if (html !== lastValue) {
						setLastValue(html);

						if (setText) {
							setText(html);
						}

						if (setRawText && rawTextContent !== undefined) {
							setRawText(rawTextContent);
						}

						if (onChangeText) {
							onChangeText(html);
						}
					}
				} else if (data.type === 'contentHeight') {
					const newHeight = Math.min(maxHeight, Math.max(minHeight, data.height));

					if (Math.abs(newHeight - editorHeight) > 2) {
						setEditorHeight(newHeight);

						if (onContentSizeChange) {
							onContentSizeChange({
								nativeEvent: {
									contentSize: {
										width: 0,
										height: newHeight
									}
								}
							});
						}
					}
				} else if (data.type === 'focus') {
					setUserInteracting(true);
					if (userInteractionTimeoutRef.current) {
						clearTimeout(userInteractionTimeoutRef.current);
					}
				} else if (data.type === 'blur') {
					// Устанавливаем таймаут для сброса флага взаимодействия
					if (userInteractionTimeoutRef.current) {
						clearTimeout(userInteractionTimeoutRef.current);
					}
					userInteractionTimeoutRef.current = setTimeout(() => {
						setUserInteracting(false);
					}, 2000);
				}
			} catch (e) {
				console.log('Error parsing WebView message:', e);
			}
		};

		// Эффект для обновления контента, только если пользователь не взаимодействует с редактором
		useEffect(() => {
			if (value !== lastValue && !isFormatting && editorReady && !userInteracting) {
				const timer = setTimeout(() => {
					editorRef.current?.injectJavaScript(`
            window.editorAPI.setContent(${JSON.stringify(value)});
            true;
          `);
					setLastValue(value);
				}, 500);

				return () => clearTimeout(timer);
			}
		}, [value, isFormatting, editorReady, lastValue, userInteracting]);

		useEffect(() => {
			if (text !== undefined && text !== lastValue && !isFormatting && editorReady && !userInteracting) {
				const timer = setTimeout(() => {
					editorRef.current?.injectJavaScript(`
            window.editorAPI.setContent(${JSON.stringify(text || '')});
            true;
          `);
					setLastValue(text || '');
				}, 500);

				return () => clearTimeout(timer);
			}
		}, [text, isFormatting, editorReady, lastValue, userInteracting]);

		return (
			<View style={[
				styles.container,
				{
					minHeight,
					maxHeight,
					overflow: 'hidden',
					position: 'relative'
				},
				style
			]}>
				{isVisible && (
					<WebView
						ref={editorRef}
						source={{ html: htmlContent }}
						style={[
							styles.container,
							{
								minHeight,
								height: editorHeight,
								maxHeight,
								backgroundColor: 'transparent',
							}
						]}
						scrollEnabled={true}
						showsVerticalScrollIndicator={false}
						hideKeyboardAccessoryView={true}
						keyboardDisplayRequiresUserAction={false}
						automaticallyAdjustContentInsets={false}
						originWhitelist={['*']}
						javaScriptEnabled={true}
						domStorageEnabled={true}
						onMessage={handleMessage}
						onLoad={() => {
							setEditorReady(true);
							if (pendingFocus) {
								forceFocus();
								setPendingFocus(false);
							}
						}}
						onContentSizeChange={() => {
							if (editorRef.current && editorReady) {
								editorRef.current.injectJavaScript(`
                  updateHeight();
                  true;
                `);
							}
						}}
					/>
				)}
			</View>
		);
	}
);

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden',
	}
}); 