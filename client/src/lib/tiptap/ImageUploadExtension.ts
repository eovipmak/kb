import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import client from '$lib/api/client';

export interface ImageUploadOptions {
	uploadFn: (file: File) => Promise<string | null>;
}

export const ImageUploadExtension = Extension.create<ImageUploadOptions>({
	name: 'imageUpload',

	addOptions() {
		return {
			uploadFn: async (file: File) => {
				const formData = new FormData();
				formData.append('file', file);

				try {
					const res = await client.post('/upload', formData, {
						headers: { 'Content-Type': 'multipart/form-data' }
					});
					return res.data.url;
				} catch (e) {
					console.error('Upload failed', e);
					return null;
				}
			}
		};
	},

	addProseMirrorPlugins() {
		const { uploadFn } = this.options;

		return [
			new Plugin({
				key: new PluginKey('imageUpload'),
				props: {
					handlePaste(view, event) {
						const items = Array.from(event.clipboardData?.items || []);
						const item = items.find((item) => item.type.indexOf('image') === 0);

						if (item) {
							event.preventDefault();
							const file = item.getAsFile();
							if (file) {
								uploadFn(file).then((url) => {
									if (url) {
										const node = view.state.schema.nodes.image.create({ src: url });
										const transaction = view.state.tr.replaceSelectionWith(node);
										view.dispatch(transaction);
									}
								});
							}
							return true;
						}
						return false;
					},
					handleDrop(view, event) {
						const hasFiles = event.dataTransfer?.files?.length;

						if (!hasFiles) {
							return false;
						}

						const images = Array.from(event.dataTransfer!.files).filter((file) =>
							/image/i.test(file.type)
						);

						if (images.length === 0) {
							return false;
						}

						event.preventDefault();

						const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

						images.forEach(async (image) => {
							const url = await uploadFn(image);
							if (url) {
								const node = view.state.schema.nodes.image.create({ src: url });
								const transaction = view.state.tr.insert(
									coordinates?.pos || view.state.selection.from,
									node
								);
								view.dispatch(transaction);
							}
						});

						return true;
					}
				}
			})
		];
	}
});
