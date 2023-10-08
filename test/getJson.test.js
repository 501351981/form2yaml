const Form2Yaml =  require("../lib/index.js");

const defaultYaml = [
    'meta:',
    '  name: test  #注释',
    '  namespace: default',
    '  #注释',
    '  description: 描述信息'
].join('\n')


describe('getJson', ()=>{
    it('获取部分json ', function () {
        let form2yaml = new Form2Yaml(defaultYaml, {
            keyMap:{
                name: 'meta.name',
                namespace: 'meta.namespace',
            }
        })

        expect(form2yaml.getJson()).toEqual({
            name: 'test',
            namespace: 'default',
        })

    });
    it('keyMap长度为空 ', function () {
        let form2yaml = new Form2Yaml(defaultYaml, {
            keyMap:{}
        })

        expect(form2yaml.getJson()).toEqual({
            meta:{
                name: 'test',
                namespace: 'default',
                description: '描述信息'
            }
        })
    });
    it('keyMap中包含不存在字段 ', function () {
        let form2yaml = new Form2Yaml(defaultYaml, {
            keyMap:{
                name: 'meta.name',
                namespace: 'meta.namespace.test',
            }
        })

        expect(form2yaml.getJson()).toEqual({
            name: 'test',
            namespace: undefined
        })

    });
    it('获取全部json ', function () {
        let form2yaml = new Form2Yaml(defaultYaml, {
            keyMap:{
                name: 'meta.name',
                namespace: 'meta.namespace.test',
            }
        })

        expect(form2yaml.getJson('all')).toEqual({
            name: 'test',
            meta:{
                namespace: 'default',
                description: '描述信息'
            }
        })

    });
})