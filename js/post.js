// 验证登录
let id = -1
let cookie = ''
const page_id = getQueryVariable("id")
const cookies = document.cookie
const cookie_list = cookies.split(";")
let save = ""
cookie_list.forEach(function (element) {
    if (element.trim().substring(0, 2) === 'id' || element.trim().substring(0, 5) === 'token') {
        save += element + "&"
    }
})
save = save.substring(0, save.length - 1)
save = save.split(" ").join("")     // 去除空格
console.log('save：' + save)
if (save.indexOf('&') > 0) {
    if (save.split('&')[0].split('=')[0].trim() === 'id') {
        id = save.split('&')[0].split('=')[1]
        cookie = save.split('&')[1].split('=')[1]
    } else {
        id = save.split('&')[1].split('=')[1]
        cookie = save.split('&')[0].split('=')[1]
    }
}
save = save.replace("id", "user_id")
console.log("新save：" + save)
if (save.indexOf("&") > 0) {
    // 请求 API
    const httpRequest = new XMLHttpRequest()
    httpRequest.open('POST', '/verify', true)
    httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
    httpRequest.send(save)
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            console.log("登录验证：" + httpRequest.responseText)
            if (httpRequest.responseText.indexOf("200") <= 0) {
                // 跳回主页登录区域
                // window.location.replace("/") 
            }
        }
    };
} else {
    // 跳回主页登录区域
    window.location.replace("/login.html")
}

let current_user_name
let current_user_id
set_userinfo()

// 页面滚动事件
window.onscroll = function () {
    if (getScrollTop() + getWindowHeight() == getScrollHeight() && window.nowPage != -1 && window.fistLoding == true) {
        // 页面滚到里底部，加载下一页

    }
}

// 该页面需要获取的用户信息有
// 顶层image的url 资料页面的imageurl 用户昵称 用户未知信息
function set_userinfo() {
    fetch("/info?id=" + id)
        .then(Response => Response.json())
        .then(data => {
            window.loginInfo = data
            var nav_image = document.getElementById("nav_image")
            nav_image.src = data.user_profile
            // 加载帖子详情
            if (page_id != false) {
                fetch("/get_post/" + page_id)
                    .then(Response => Response.json())
                    .then(data => {
                        createPostBody(data, 0, true)
                        setTimeout(() => {
                            // 获取评论列表
                            fetch("/get_comment/" + page_id)
                                .then(Response => Response.json())
                                .then(data => {
                                    if (data.length > 0) {
                                        for (let i = 1; i < data.length; i++) {
                                            const info = data[i]
                                            const body = document.createElement("div")
                                            body.id = "comment-" + info.comment_id
                                            body.className = "text-black p-4 antialiased flex"
                                            body.innerHTML = `
                                            <img class="rounded-full h-8 w-8 mr-2 mt-1 " src="${info.comment_author_profileurl}">
                                            <div>
                                                <div class="bg-gray-100 rounded-lg px-4 pt-2 pb-2.5">
                                                    <div class="font-semibold text-sm leading-relaxed">${info.comment_author_name}</div>
                                                    <div class="text-xs leading-snug md:leading-normal">${info.comment_content}</div>
                                                </div>
                                            </div>
                                            <div style="flex:1"></div>
                                            <svg class="w-6 h-6 close-btn" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
                                            document.getElementById("post-" + page_id).insertBefore(body, document.getElementById("post-" + page_id).children[6])
                                            fetch("/can_i_delete?user_id=" + id + "&comment_id=" + info.comment_id)
                                                .then(Response => Response.json())
                                                .then(data_can => {
                                                    if (data_can.code == 403 && data_can.message == "false") {
                                                        document.getElementById("comment-" + info.comment_id).children[3].style.display = "none"
                                                    } else {
                                                        document.getElementById("comment-" + info.comment_id).children[3].onclick = function() {
                                                            fetch("/delete_comment?user_id=" + id + "&comment_id=" + info.comment_id)
                                                                .then(Response => Response.json())
                                                                .then(() => {
                                                                    window.location.reload()
                                                                })
                                                        }
                                                    }
                                                })
                                        }
                                    }
                                })
                        }, 300)
                        // 加载用户信息
                        fetch("/info?id=" + data.post_author)
                            .then(Response => Response.json())
                            .then(data => {
                                window.loginInfo = data
                                var profile = document.getElementById("user_image")
                                profile.src = data.user_profile

                                var name = document.getElementById("user_name")
                                name.value = data.user_name
                                name.innerHTML = data.user_name

                                var location = document.getElementById("user_location")
                                location.innerHTML = data.user_location
                            }).catch(console.error)
                        fetch("/show_user_count?user_id=" + data.post_author)
                            .then(Response => Response.json())
                            .then(data => {
                                var user_post_count = document.getElementById("post_count")
                                var user_followers_count = document.getElementById("followers_count")
                                var user_follows_count = document.getElementById("follows_count")

                                user_post_count.innerHTML = data.user_post_count
                                user_followers_count.innerHTML = data.user_followers_count
                                user_follows_count.innerHTML = data.user_follows_count
                            }).catch(console.error)
                        // 加载关注者列表
                        get_my_follows(document.getElementById("follows_list"), data.post_author)
                    })
            } else {
                window.location.replace("/home/index.html")
            }

        }).catch(console.error)
}

//发送帖子
function post_by_post_author() {
    var post_author = id
    var post_content = document.getElementById("post_content").value
    var post_image_url = upload_address

    fetch("/post?post_author=" + post_author + "&post_content=" + post_content + "&post_image_url=" + post_image_url)
        .then(Response => Response.json())
        .then(data => {
            console.log(data)
            if (data.code === 200) {
                console.log("上传成功！")
                post_plus_by_user_id()
                location.reload()
            } else {
                alert(data.message)
            }
        }).catch(console.error)
}

//发送帖子的同时呢 把该用户下的 count 帖子 +1 
function post_plus_by_user_id() {
    var user_id = id
    fetch("/post_plus?user_id=" + id)
        .then(Response => Response.json())
        .then(data => {
            if (data.code == 200) {
                console.log("发帖子成功！帖子数量+1")
            } else {
                alert("帖子发送成功！但计数api出错！")
            }
        }).catch(console.error)
}

let upload_file
let upload_address

function onChange(event) {
    upload_file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        console.log("输出上传图片文件结果")
        console.log(event.target.result)
    };
    reader.readAsText(upload_file);
    get_upload_image_url()
}

function get_upload_image_url() {
    let file = upload_file
    //   表单数据对象
    let formatData = new FormData()
    // 第一个 key           fileInfo
    // 第二个value是对应的值 file
    // 把上传的内容添加到表单 数据对象里面
    formatData.append("file", file)
    fetch("https://image.chuhelan.com/api/v1/upload", {
        method: "POST",
        headers: {
            // 'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
            // 'Access-Control-Allow-Origin': '*',
            'Accept-Encoding': 'gzip, deflate, br',
            // 'Access-Control-Allow-Headers': 'Content-Type,X-Custom-Header',
            // 'Access-Control-Allow-Methods': 'POST,GET,OPTIONS,DELETE',
            'Connection': 'keep-alive'
        },
        body: formatData
    }).then(Response => Response.json())
        .then(data => {
            console.log(data)
            if (data.status === true) {
                console.log("上传成功！")
                upload_address = data.data.links.url
                document.getElementById("image_image").src = upload_address
                document.getElementById("image_div").style.display = "flex"
                console.log(upload_address)

            }
            else {
                alert(data.message)
            }
        }).catch(console.error)
}



//设置一个完整的帖子 我将它分成几个部分 先用注释打出来
//最外层 一个div  <div class="bg-white shadow rounded-lg mb-6">
//顶部信息状态
//分界线
//帖子正文加帖子图像 
//帖子互动部分
//帖子数据部分
//评论部分 *评论不止一个 需要链接数据库 搜寻到所有该帖子下的所有评论
//自己发送帖子部分

function set_a_full_post_by_post_id_order_by_desc() {
    // what i need
    set_outter_div()


}

// 创建最外层div
function set_outter_div() {
    const outter_div = document.createElement("div")
    outter_div.className = "bg-white shadow rounded-lg mb-6"
}

// 关注
function followUser(followid) {
    if (id !== followid) {
        fetch("/follow?user_id=" + id + "&follow_id=" + followid)
            .finally(() => {
                // 刷新页面
                window.location.reload()
            })
    }
}

// -----------------------------------------


function getScrollTop() {
    var scrollTop = 0, bodyScrollTop = 0, documentScrollTop = 0;
    if (document.body) {
        bodyScrollTop = document.body.scrollTop;
    }
    if (document.documentElement) {
        documentScrollTop = document.documentElement.scrollTop;
    }
    scrollTop = (bodyScrollTop - documentScrollTop > 0) ? bodyScrollTop : documentScrollTop;
    return scrollTop;
}

//文档的总高度
function getScrollHeight() {
    var scrollHeight = 0, bodyScrollHeight = 0, documentScrollHeight = 0;
    if (document.body) {
        bodyScrollHeight = document.body.scrollHeight;
    }
    if (document.documentElement) {
        documentScrollHeight = document.documentElement.scrollHeight;
    }
    scrollHeight = (bodyScrollHeight - documentScrollHeight > 0) ? bodyScrollHeight : documentScrollHeight;
    return scrollHeight;
}

function getWindowHeight() {
    var windowHeight = 0;
    if (document.compatMode == "CSS1Compat") {
        windowHeight = document.documentElement.clientHeight;
    } else {
        windowHeight = document.body.clientHeight;
    }
    return windowHeight;
}

// 获取 URL 内的参数
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}

// 获取 Cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}