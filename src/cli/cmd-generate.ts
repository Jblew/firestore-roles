import { Configuration } from "../Configuration";
import { RulesGenerator } from "../RulesGenerator";

export async function execGenerateCmd(config: Configuration, customRules: string) {
    Configuration.validate(config);
    const generator = new RulesGenerator(config, customRules);

    const output = generator.asString();

    return {
        message: output + "\n",
        output,
    };
}
