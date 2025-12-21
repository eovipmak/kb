import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { type Editor } from '@tiptap/core';
import tippy from 'tippy.js';
import { mount, unmount } from 'svelte';
import CommandsList from './CommandsList.svelte';

const getSuggestionItems = ({ query }: { query: string }) => {
	return [
		{
			title: 'Heading 1',
			icon: 'H1',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
			}
		},
		{
			title: 'Heading 2',
			icon: 'H2',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
			}
		},
		{
			title: 'Heading 3',
			icon: 'H3',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
			}
		},
		{
			title: 'Text',
			icon: 'P',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).setParagraph().run();
			}
		},
		{
			title: 'Bullet List',
			icon: '•',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).toggleBulletList().run();
			}
		},
		{
			title: 'Ordered List',
			icon: '1.',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).toggleOrderedList().run();
			}
		},
		{
			title: 'Task List',
			icon: '☑',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).toggleTaskList().run();
			}
		},
		{
			title: 'Blockquote',
			icon: '"',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).toggleBlockquote().run();
			}
		},
		{
			title: 'Code Block',
			icon: '</>',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
			}
		},
		{
			title: 'Image',
			icon: '🖼',
			command: ({ editor, range, props }: { editor: Editor; range: any; props: any }) => {
				// Call the external image handler provided in props
				editor.chain().focus().deleteRange(range).run();
				if (props.uploadImageCallback) {
					props.uploadImageCallback();
				}
			}
		},
		{
			title: 'Table',
			icon: '⊞',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor
					.chain()
					.focus()
					.deleteRange(range)
					.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
					.run();
			}
		},
		{
			title: 'Horizontal Rule',
			icon: '—',
			command: ({ editor, range }: { editor: Editor; range: any }) => {
				editor.chain().focus().deleteRange(range).setHorizontalRule().run();
			}
		}
	]
		.filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
		.slice(0, 10);
};

export const Commands = (uploadImageCallback: () => void) =>
	Extension.create({
		name: 'slash-commands',

		addOptions() {
			return {
				suggestion: {
					char: '/',
					command: ({ editor, range, props }: { editor: Editor; range: any; props: any }) => {
						props.command({ editor, range, props: { ...props, uploadImageCallback } });
					}
				}
			};
		},

		addProseMirrorPlugins() {
			return [
				Suggestion({
					editor: this.editor,
					...this.options.suggestion
				})
			];
		}
	}).configure({
		suggestion: {
			items: getSuggestionItems,
			render: () => {
				let component: any;
				let popup: any;
				let propsState = $state({
					items: [] as any[],
					command: (item: any) => {}
				});

				return {
					onStart: (props: any) => {
						propsState.items = props.items;
						propsState.command = props.command;

						const element = document.createElement('div');

						component = mount(CommandsList, {
							target: element,
							props: propsState
						});

						if (!props.clientRect) {
							return;
						}

						popup = tippy('body', {
							getReferenceClientRect: props.clientRect,
							appendTo: () => document.body,
							content: element,
							showOnCreate: true,
							interactive: true,
							trigger: 'manual',
							placement: 'bottom-start'
						});
					},

					onUpdate(props: any) {
						propsState.items = props.items;

						if (!props.clientRect) {
							return;
						}

						popup[0].setProps({
							getReferenceClientRect: props.clientRect
						});
					},

					onKeyDown(props: any) {
						if (props.event.key === 'Escape') {
							popup[0].hide();
							return true;
						}

						return component.onKeyDown(props);
					},

					onExit() {
						popup[0].destroy();
						unmount(component);
					}
				};
			}
		}
	});
