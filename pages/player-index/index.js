var timer = null
Page({
    data: {
        show: false,
        isPlay: false,
        duration: 0,
        index: 0,
        currentTime: 0,
        time: null,
        playing: {},
        list: [
            {
                name: '玻璃之情',
                singer: '张国荣',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/zgr_blzq.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/zgr.jpg'
            },
            {
                name: '手掌印',
                singer: '江若琳',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/szy.a4f3564.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/jrl.jpg'
            },
            {
                name: '钟无艳',
                singer: '谢安琪',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/xaq_zwy.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/ms.jpg'
            },
            {
                name: '痴心换情深',
                singer: '周慧敏',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/zhm_cxhqs.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/zhm.jpg'
            },
            {
                name: '最爱',
                singer: '周慧敏',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/zhm_za.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/zhm.jpg'
            },
            {
                name: '旧情绵绵',
                singer: '张学友',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/zxy_jqmm.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/zxy.jpg'
            },
            {
                name: '夕阳醉了',
                singer: '张学友',
                isPlaying: false,
                src: 'https://894620576.github.io/vue-demo/static/media/zxy_xyzl.mp3',
                img: 'https://894620576.github.io/vue-demo/static/img/zxy.jpg'
            },

        ]

    },
    onShow: function () {

        const that = this
        wx.getStorage({
            key: 'list',
            success: function (res) {
                console.log(res)
                for (let item in res.data) {
                    that.setData({
                        [item]: res.data[item]
                    })
                }
            }
        })
        const o = wx.getBackgroundAudioManager().paused;
        if (o !== undefined && !o) {
            that.setData({
                isPlay: true
            })
            that.getCurrentTime()
        } else {
            that.setData({
                isPlay: false
            })
            clearInterval(timer)
        }


    },
    onReady: function (e) {
        wx.clearStorage();
        console.log('onReady')
        this.setData({
            playing: this.data.list[0]
        })
    },
    getWxStorage() {
        wx.getStorage({
            key: 'list',
            success: function (res) {
                console.log(res.data)
            }
        })
    },
    playItem(e) {
        const i = e.currentTarget.dataset.id
        this.playBGM(i)
    },
    audioPlay() {
        clearInterval(timer)
        if (this.data.isPlay) {
            this.setData({
                isPlay: false
            })
            wx.getBackgroundAudioManager().pause()
        } else {
            //
            if (wx.getBackgroundAudioManager().title !== undefined) {
                wx.getBackgroundAudioManager().play()
                this.getCurrentTime()
                this.setData({
                    isPlay: true
                })
            } else {
                this.setData({
                    isPlay: false
                })
                this.playBGM(this.data.index)
            }
        }
    },
    playBGM(i) {
        clearInterval(timer)
        var that = this
        var res = 'list[' + i + '].isPlaying'
        for (let m in that.data.list) {
            var e = 'list[' + m + '].isPlaying'
            this.setData({
                [e]: false
            })
        }
        wx.playBackgroundAudio({
            dataUrl: that.data.list[i].src,
            title: that.data.list[i].name,
            coverImgUrl: that.data.list[i].img,
            complete: () => {
                console.log('开始播放')
                that.getCurrentTime()
                that.setData({
                    isPlay: true,
                    index: parseInt(i),
                    playing: that.data.list[i],
                    [res]: true
                })
                console.log(that.data)
            }
        })
        //wx.getBackgroundAudioManager().seek(275)
    },
    next() {
        clearInterval(timer)
        const l = this.data.list.length
        var i = this.data.index + 1
        if (l == i) {
            this.setData({
                index: 0
            })
            i = 0
        } else {
            this.setData({
                index: i
            })
        }
        this.playBGM(i)
    },
    pre() {
        clearInterval(timer)
        const l = this.data.list.length
        var i = this.data.index
        if (i == 0) {
            i = l - 1
            this.setData({
                index: i
            })
        } else {
            i--
            this.setData({
                index: i
            })
        }
        //console.log(i)
        this.playBGM(i)

    },
    getCurrentTime() { ///计算进度
        clearInterval(timer)
        timer = setInterval(() => {
            const BGM = wx.getBackgroundAudioManager() //背景音乐对象
            const s = parseInt(BGM.currentTime)//当前播放时间
            const e = parseInt(BGM.duration)//歌曲持续时间
            var num = ((s) / (e) * 100).toFixed(2) //算出进度
            var SIX = this.data.index + 1
            var l = this.data.list.length
            if ((s + 2) == e && e !== 0) {
                if (SIX == l) {
                    SIX = 0
                }
                console.log('下一曲')
                this.playBGM(SIX)
                return
            }
            this.setData({
                currentTime: num, //进度
            });
        }, 500)
    },
    newPage(e) {
        const that = this
        clearInterval(timer)
        wx.setStorage({
            key: 'list',
            data: that.data
            , success: function (res) {
            }
        })

        console.log(this.data)

        wx.navigateTo({
            url: '../player/player?name=' + e.currentTarget.dataset.name
        })

    },
    showMenu() {
        if (this.data.show) {
            this.setData({
                show: false
            })
        } else {
            this.setData({
                show: true
            })
        }
    },

})
