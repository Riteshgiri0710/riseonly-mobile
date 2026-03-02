import { SkImage, Skia } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { Image as RNImage } from "react-native";

export function useSkiaImageFromUrl(source?: string | number): SkImage | null {
	const [image, setImage] = useState<SkImage | null>(null);

	useEffect(() => {
		let isMounted = true;

		const loadImage = async () => {
			if (!source) return;

			try {
				if (typeof source === "number") {
					const asset = RNImage.resolveAssetSource(source);
					const response = await fetch(asset.uri);
					const buffer = await response.arrayBuffer();
					const uint8Array = new Uint8Array(buffer);
					const skData = Skia.Data.fromBytes(uint8Array);
					const skiaImage = Skia.Image.MakeImageFromEncoded(skData);
					if (isMounted && skiaImage) setImage(skiaImage);
				} else {
					const response = await fetch(source);
					const buffer = await response.arrayBuffer();
					const uint8Array = new Uint8Array(buffer);
					const skData = Skia.Data.fromBytes(uint8Array);
					const skiaImage = Skia.Image.MakeImageFromEncoded(skData);
					if (isMounted && skiaImage) setImage(skiaImage);
				}
			} catch (error) {
				console.warn("Error loading image:", error);
			}
		};

		loadImage();

		return () => {
			isMounted = false;
		};
	}, [source]);

	return image;
}
