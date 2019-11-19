const fs = require('fs')
const path = require('path')

// 搜索包模块
const moduleName = process.argv[2]

// 校验包模块是否有效
function validateModuleName(moduleName) {
  if (!moduleName) {
    throw new Error('please specific module name')
  }
}

// 判断模块名称是否带有路径
function hasPath(moduleName) {
  return /(^\/|\.\/|\.\.\/).+/.test(moduleName)
}

// 是否是内置模块
function isBuiltIn(moduleName) {
  try {
    const path = require.resolve(moduleName)

    return !hasPath(path)
  } catch (err) {
    return false
  }
}

// 生成模块可能存在的文件
function getExistFiles(moduleName) {
  return {
    files: [
      moduleName,
      `${moduleName}.js`,
      `${moduleName}.json`,
      `${moduleName}.node`
    ],
    dirs: [
      `${moduleName}/package.json`,
      `${moduleName}/index.js`,
      `${moduleName}/index.json`,
      `${moduleName}/index.node`
    ]
  }
}

// 向上搜索 node_modules 下的模块
function upFindModule(roots, moduleNames, inNodeModules = true) {
  for (let i = 0; i < roots.length; i++) {
    for (const name of moduleNames) {
      const realPath = path.join(
        roots.slice(0, roots.length - i).join('/'),
        inNodeModules ? 'node_modules' : '',
        name
      )

      if (fs.existsSync(realPath)) {
        console.log(`${realPath} found √`)
        return true
      }

      console.log(`${realPath} not found`)
    }
  }
}

// 搜索其他模块
function findOtherModule(moduleName){
  const roots = __dirname.split('/')
  const {files, dirs} = getExistFiles(moduleName)

  roots[0] = roots[0] || '/'

  const isFound = upFindModule(roots, files)
  return isFound || upFindModule(roots, dirs)
}

// 搜索带有路径的模块
function findModuleWithPath(moduleName){
  const reg = /[^\/]+?$/
  const name = moduleName.match(reg)[0]

  const roots = [
    path.relative(
      __dirname,
      moduleName.replace(reg, ''),
    )
  ]

  roots[0] = path.join(__dirname, roots[0])
  
  const {files, dirs} = getExistFiles(name)

  const isFound = upFindModule(roots, files, false)
  
  return isFound || upFindModule(roots, dirs, false)
}

// 主模块
function main(moduleName) {
  validateModuleName(moduleName)

  // 带有路径按照非内置模块查找
  if (hasPath(moduleName)) {
    if(findModuleWithPath(moduleName)) {
      return 0
    }
  } else if (isBuiltIn(moduleName)) {
    // 不带路径先按照内置模块判断
    console.log(`built-in ${moduleName} found √`)

    return 0
  } else {
    // 查找不带路径的其他模块
    if(findOtherModule(moduleName)) {
      return 0
    }
  }

  throw new Error(`${moduleName} not found`)
}

main(moduleName)