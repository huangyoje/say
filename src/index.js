"use strict";

// 生成index.html
// slides.html
let cheerio = require('cheerio');
let fs = require('fs');
let path = require("path");
let sprintf = require("sprintf-js").sprintf;

//
var baseDir = process.cwd();

// docs 目录
var rootDir = path.join(baseDir, "docs");
// slide 目录
var slideDir = "slide";

// index 模板文件
var indexTemplateDir = path.join(baseDir, "config/templates/index.html");

// 生成的 index 文件
var targetIndexFile = path.join(baseDir, "docs/index.html");
// 生成的 slide index 文件
var targetSlideIndexFile = path.join(baseDir, "docs/slides.html");

var Item = {　　　　
  createNew: function() {　　　　　　
    var item = {};
    item.href = "index.html";
    item.title = "give me a title";
    item.date = "long long ago";
    item.abstract = "...";
    item.content = "...";　　　　　　
    return item;　　　　
  }　　
};
// 博客列表<li>...</li>标签
var blogLiElem = '<li>' +
  '  <article class="blog ">' +
  '      <header>' +
  '          <a href="%(href)s">' +
  '              <h3>%(title)s</h3>' +
  '              <h4>%(date)s</h4>' +
  '          </a>' +
  '      </header>' +
  '      <p class="abstract">%(content)s</p>' +
  '  </article>' +
  '</li>';

var slideLiElem = '<li><a href="%(href)s"><h3>%(title)s</h3></a></li>'

// 列出所有的博客,并且根据日期排序
function allHtmlItems(directory) {
  return fs.readdirSync(directory).filter(function(item) {
    return isHtmlFile(item);
  });
}

function isHtmlFile(filename) {
  return filename.endsWith('.html') && filename !== 'index.html' && filename !== 'slides.html';
}

// 获取博客标题
function getBlogTitle(blog_$) {
  return blog_$("title").text();
}

// 获取博客的日期
function getBlogDate(blog_$) {
  return blog_$("meta[name=date]").attr("content");
}

// 获取博客内容（abstract 或 300字)
function getBlogContent(blog_$) {
  if (blog_$("meta[name=abstract]").length !== 0) {
    return blog_$("meta[name=abstract]").attr("content");
  }
  return blog_$('article.post p').first().html();
}

// 根据日期排序
function sortItems(items) {
  items.sort(function(item1, item2) {
    // 逆序
    return item1.date < item2.date ? 1 : (item1.date >item2.date ? -1 : 0)
  })
}

// 渲染博客列表
function renderItems(template, blogItems) {
  var blogLiElems = [];
  blogItems.forEach(function(item) {
    blogLiElems.push(sprintf(template, item));
  })
  return blogLiElems.join("");
}

function getItems(dir) {
  // 全路径
  var fullPath = path.join(rootDir, dir);
  // 所有的博客文件
  var files = allHtmlItems(fullPath);
  var items = [];
  files.forEach(function(file) {
    var fullname = path.join(fullPath, file);
    var htmlItem_$ = cheerio.load(fs.readFileSync(fullname), {
      decodeEntities: false
    });
    var item = Item.createNew();
    item.title = getBlogTitle(htmlItem_$);
    item.date = getBlogDate(htmlItem_$);
    item.content = getBlogContent(htmlItem_$);
    item.href = joinHref(dir, file);
    items.push(item);
  })
  sortItems(items);
  return items;
}

function joinHref(str1, str2) {
  var arr = [str1, str2];
  return arr.filter(function(str) {
    return str !== "";
  }).join("/");
}

// 生成index 页面
function createIndex() {
  var blogItems = getItems("");
  // 获取index页面模版
  var index_$ = cheerio.load(fs.readFileSync(indexTemplateDir), {
    decodeEntities: false
  });
  index_$('.content .bloglist').append(renderItems(blogLiElem, blogItems));

  fs.writeFileSync(path.join(targetIndexFile), index_$.html(), {
    'encoding': 'utf-8'
  });
  console.log("generate blog index: " + targetIndexFile)
}

function createSlideIndex() {
  var slideItems = getItems(slideDir);
  // 获取index页面模版
  var index_$ = cheerio.load(fs.readFileSync(indexTemplateDir), {
    decodeEntities: false
  });
  index_$('.content .slidelist').append(renderItems(slideLiElem, slideItems));
  fs.writeFileSync(path.join(targetSlideIndexFile), index_$.html(), {
    'encoding': 'utf-8'
  });
  console.log("generate slide index: " + targetSlideIndexFile)
}


module.exports.createIndex = createIndex;
module.exports.createSlideIndex = createSlideIndex;
