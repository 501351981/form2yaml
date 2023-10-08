const Form2Yaml =  require("../lib/index.js");

const defaultYaml = [
    'meta:',
    '  name: test  #注释',
    '  namespace: default',
    '  #注释',
    '  description: 描述信息'
].join('\n')

describe("数据校验", ()=>{
    it("校验通过", ()=>{
        let form2yaml = new Form2Yaml(defaultYaml, {
            rules:{
                'meta.name':[
                    {required: true},
                    {pattern: /^.{1,10}$/, 'message': '长度必须1-10'}
                ]
            }
        })
        return expect(form2yaml.validate()).resolves.toEqual();
    })
    it("校验不通过", ()=>{
        let form2yaml = new Form2Yaml(defaultYaml, {
            rules:{
                'meta.name':[
                    {required: true},
                    {pattern: /^.{10,30}$/, 'message': '长度必须10-30'}
                ]
            }
        })
        return expect(form2yaml.validate()).rejects.toEqual( [
            {"field": "meta.name", "fieldValue": "test", "message": "长度必须10-30"}
        ]);
    })
})