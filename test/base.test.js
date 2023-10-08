const Form2Yaml =  require("../lib/index.js");

const defaultYaml = [
    'meta:',
    '  name: test  #注释',
    '  namespace: default',
    '  #注释',
    '  description: 描述信息'
].join('\n')


describe('基础功能', ()=>{
    it('获取json', function () {
        let form2yaml = new Form2Yaml(defaultYaml)

        expect(form2yaml.getJson()).toEqual({
            meta:{
                name: 'test',
                namespace: 'default',
                description: '描述信息'
            }
        })
        expect(form2yaml.getYaml()).toEqual(defaultYaml)

    });
})
