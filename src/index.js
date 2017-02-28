"use strict";

// 生成index.html
let cheerio = require('cheerio');
let fs = require('fs');
let path = require("path");
let sprintf = require("sprintf-js").sprintf;

//
var baseDir = process.cwd();

// docs 目录
var targetDir = path.join(baseDir, "docs");
// index 页面目录
var indexTemplateDir = path.join(baseDir, "config/templates/index.html");
var indexDir = path.join(baseDir, "docs/index.html");
// 博客列表<li>...</li>标签
var blogLiElem = '<li>' +
              '  <article class="blog ">' +
              '      <header>' +
              '          <a href="/%(filename)s">' +
              '              <h3>%(title)s</h3>' +
              '              <h4>%(date)s</h4>' +
              '          </a>' +
              '      </header>' +
              '      <p class="abstract">%(content)s</p>' +
              '  </article>' +
              '</li>';

// 列出所有的博客,并且根据日期排序
function allBlos(){
  return fs.readdirSync(targetDir);
}

// 获取博客标题
function getBlogTitle(blog_$){
  return blog_$("title").text();
}

// 获取博客的日期
function getBlogDate(blog_$){
  return blog_$("meta[name=date]").attr("content");
}

// 获取博客内容（abstract 或 300字)
function getBlogContent(blog_$){
  if (blog_$("meta[name=abstract]").length !== 0){
    return blog_$("meta[name=abstract]").attr("content");
  }
  return blog_$('article.post p').first().html();
}

// 根据日期排序
function sortBlog(blogItems){
  blogItems.sort(function (item1, item2){
    if (item1.date === item2.date){
      return 0;
    }
    // 逆序
    return item1.date < item2.date;
  })
}

// 获取所有博客的简介
function getBlogItems(){
  // 所有的博客文件
  var blogFiles = allBlos();
  var blogItems = [];
  blogFiles.forEach(function (blogFile){
    var fullname = path.join(targetDir,blogFile);
    var blog_$ = cheerio.load(fs.readFileSync(fullname), { decodeEntities: false });
    var o = {};
    o.title = getBlogTitle(blog_$);
    o.date = getBlogDate(blog_$);
    o.content = getBlogContent(blog_$);
    o.filename = blogFile;
    blogItems.push(o);
  })
  sortBlog(blogItems);
  return blogItems;
}

// 渲染博客列表
function renderBlogItems(blogItems){
  var blogLiElems = [];
  blogItems.forEach(function (item){
    blogLiElems.push(sprintf(blogLiElem, item));
  })
  return blogLiElems.join("<br>");
}

// 生成index 页面
function createIndex(){
  var blogItems = getBlogItems();
  // 获取index页面模版
  var index_$ = cheerio.load(fs.readFileSync(indexTemplateDir), { decodeEntities: false });
  index_$('.content .bloglist').append(renderBlogItems(blogItems));

  fs.writeFileSync(path.join(indexDir), index_$.html(), {'encoding': 'utf-8'});
}


module.exports.createIndex = createIndex;
