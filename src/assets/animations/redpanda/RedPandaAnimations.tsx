import partyAnimation from "@animations/party.json";
import { todoNotify } from '@core/config/const';
import LottieView from 'lottie-react-native';
import { observer } from 'mobx-react-lite';
import { Pressable, View } from 'react-native';

const variants = [
	{ animation: "fun", premium: false },
	{ animation: "like", premium: false },
	{ animation: "love", premium: false },
	{ animation: "panic", premium: false },
	{ animation: "hello", premium: false },
	{ animation: "sleep", premium: false },
	{ animation: "evil", premium: false },
	{ animation: "congrats", premium: false },
	{ animation: "hey", premium: false },
	{ animation: "like", premium: false },
	{ animation: "quite", premium: false },
	{ animation: "greetings", premium: false },
	{ animation: "help", premium: false },
	{ animation: "what", premium: false },
	{ animation: "embarass", premium: false },
	{ animation: "no", premium: false },
	{ animation: "gift", premium: false },
	{ animation: "disgusting", premium: false },
	{ animation: "relax", premium: false },
	{ animation: "alcohol", premium: false },
	{ animation: "work", premium: false },
	{ animation: "sleepy", premium: false },
	{ animation: "nothing", premium: false },
	{ animation: "sorry", premium: false },
	{ animation: "thank", premium: false },
	{ animation: "rest", premium: false },
	{ animation: "shopping", premium: true },
	{ animation: "eat", premium: true },
	{ animation: "dance", premium: true },
] as const;

const animationMap = {
	fun: require("./json/fun.json"),
	like: require("./json/like.json"),
	love: require("./json/love.json"),
	panic: require("./json/panic.json"),
	hello: require("./json/hello.json"),
	sleep: require("./json/sleep.json"),
	evil: require("./json/evil.json"),
	congrats: require("./json/congrats.json"),
	hey: require("./json/hey.json"),
	quite: require("./json/quite.json"),
	greetings: require("./json/greetings.json"),
	help: require("./json/help.json"),
	what: require("./json/what.json"),
	embarass: require("./json/embarass.json"),
	no: require("./json/no.json"),
	gift: require("./json/gift.json"),
	disgusting: require("./json/disgusting.json"),
	relax: require("./json/relax.json"),
	alcohol: require("./json/alcohol.json"),
	work: require("./json/work.json"),
	sleepy: require("./json/sleepy.json"),
	nothing: require("./json/nothing.json"),
	sorry: require("./json/sorry.json"),
	thank: require("./json/thank.json"),
	rest: require("./json/rest.json"),
	shopping: require("./json/shopping.json"),
	eat: require("./json/eat.json"),
	dance: require("./json/dance.json"),
} as const satisfies Record<AnimationType, any>;

export type AnimationType = typeof variants[number]["animation"];

interface RedPandaAnimationsProps {
	size?: number;
	variant: AnimationType;
}

export const RedPandaAnimations = observer(({
	size = 100,
	variant
}: RedPandaAnimationsProps) => {
	const style = {
		width: size,
		height: size,
	};

	const selectedAnimation = variants.find(t => t.animation === variant);

	if (!selectedAnimation) return;

	const onAnimationPress = () => {
		if (!selectedAnimation.premium) return;
		todoNotify();
	};

	return (
		<Pressable
			style={style}
			onPress={onAnimationPress}
		>
			<LottieView
				source={animationMap[selectedAnimation.animation]}
				autoPlay
				loop
				style={{ width: size, height: size }}
			/>
		</Pressable>
	);
});