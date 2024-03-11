import overUnder from "../assets/backgrounds/over-under.png";
import overUnderSkills from "../assets/backgrounds/over-under-skills.png";
import defaultBackground from "../assets/backgrounds/default.png";

export type Background = "over-under" | "over-under-skills" | "default";

export const backgrounds: { [key in Background]: string } = {
	"over-under": overUnder,
	"over-under-skills": overUnderSkills,
	default: defaultBackground,
};