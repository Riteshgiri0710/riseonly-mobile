export const getChatTypeTKey = (isPublic: boolean) => {
	if (isPublic) {
		return "public_type";
	}

	if (!isPublic) {
		return "private_type";
	}

	return "[getChatTypeByType]: error";
};