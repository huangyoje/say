---
title: 'pandoc  使用'
date: 2017-02-15
...

## what is pandoc
  [pandoc](https://github.com/jgm/pandoc) 用于将一种标记语言的文本转化为另一种标记语言格式。如将markdown转化为html, pdf等。  `pandoc` 是一个命令行工具,使用 [HasKell](https://www.haskell.org/) 语言编写。  
  👉 [目前支持的可以互相转化的标记语言](http://pandoc.org/index.html)   

## 安装
[https://github.com/jgm/pandoc/blob/master/INSTALL.md](https://github.com/jgm/pandoc/blob/master/INSTALL.md)

## 使用
`pandoc [选项] [需要转化的文件]`

#### 常用选项
- `-f format`或`--from=format` 指定需要转化的文件格式  
- `-t format`或`--to=format` 指定转化后的文件格式
- `-o filename`或`--output=filename` 转化后的文件名称
- `-s` 加上该参数，会根据默认的模版生成完整的转化后的文件，包含header, footer。
- `--template 模版文件路径` 指定模版文件，和 `-s` 一起使用，模版文件编写参考[](), 通过 `pandoc -D 格式` 可以查看某种格式默认的模版

#### 需要转化的文件
可以根据本地文件路径或url指定，可以传入多个文件，空格分开  
如果不传该参数，表示接受标准输入

## 支持的格式
markdown , html4, html5, pdf...

## 示例
1. md to html5
``` {.zsh}
pandoc -s --template=./config/templates/default.html5 -f markdown -t html5 -o ./target/pandoc.html ./articles/pandoc.md
```
2. 字符集
pandoc 支持的字符编码为utf-8, 如果输入文件或输出文件非utf-8, 则使用 `iconv` 命令转化，如下
```zsh
iconv -t utf-8 input.txt | pandoc | iconv -f utf-8
```

## 进阶
1. 查看支持高亮的语言
```zsh
pandoc --list-highlight-languages
```

2. 查看支持的高亮的样式
```zsh
pandoc --list-highlight-stylesb
```

3. 选择高亮的样式
```zsh
# 可选的有tango,espresso,zenburn,breezedark,haddock,monochrome,pygments(默认使用)
pandoc --highlight-style=monochrome
```

4. 禁用高亮
```zsh
pandoc --no-highlight
```

5. 查看pandoc对markdown支持的扩展
``` {.bash}
# 使用某种扩展, markdown+extensionname
# 禁用某种扩展, markdown-extensionname
pandoc --list-extensions
```
