declare module 'form2yaml' {
    interface Form2YamlOptions {
        mergeJsonOfYaml?: boolean;
        nonMergeableKeys?: string[],
        ignoreExtra?: boolean;
        emptyMode?: object;
        keyMap?: object;
        rules?: {
            [key: string]: any[]; // 这里的 `any` 可以替换为你期望的值类型
        };
    }

    export default class Form2Yaml {
        constructor(yaml?: string, options?: Form2YamlOptions);
        getYaml(): string;
        setYaml(yaml:string): Form2Yaml;
        getJson(type?: string): any;
        setJson(json:any): Form2Yaml;
        validate(): Promise<any>;
        
    }
}