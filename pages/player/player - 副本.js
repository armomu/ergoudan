Page({
    data:{
        show:false,
        isPlay:false,
        duration:0,
        index:0,
        currentTime:0,
        time:null,
        currentTimeStr:'00:0',
        durationStr:'00:0',
        playing:{
        },
        list:[]
       
    },
    onShow:function(){       
        
    },
    onLoad: function(options){
        const that = this    
            
        wx.getStorage({
            key: 'list',
            success: function(res) {
                for(let item in res.data){
                    that.setData({
                        [item] : res.data[item]
                    })
                    wx.setNavigationBarTitle({
                        title: res.data.playing.name,            
                    })       
            
                }  
            } 
        })  
        clearInterval(this.data.time)
        that.setData({
            time : null
        }) 
        const o = wx.getBackgroundAudioManager().paused;       
        if(o == undefined || o == true) return
        if(!o){            
            // that.setData({
            //     isPlay : true                        
            // }) 
            that.getCurrentTime()
        }  
        console.log(o)
        
        
    },    
    playBGM(i){
        
        var that = this
        var res = 'list[' + i + '].isPlaying'

        for(let m in this.data.list){
            var e = 'list[' + m + '].isPlaying'
            this.setData({
                [e]:false
            })
        }
        wx.playBackgroundAudio({
            dataUrl:that.data.list[i].src,
            title:that.data.list[i].name,
            coverImgUrl:that.data.list[i].img,            
            complete:() => {
                console.log('成功')
                that.getCurrentTime()
                this.setData({
                    isPlay : true,
                    index : parseInt(i),
                    playing : that.data.list[i],
                    [res] : true
                }) 
                wx.setNavigationBarTitle({
                    title: that.data.playing.name,            
                })                
            }
        })
    },
    getCurrentTime(){ ///计算进度    
        this.setData({
            time : null
        })      
        this.data.time = setInterval( () => {
            const BGM = wx.getBackgroundAudioManager() //背景音乐对象
            const s = parseInt(BGM.currentTime)//当前播放时间
            const e = parseInt(BGM.duration)//歌曲持续时间
            const num = ((s)/(e) * 100).toFixed(2) //算出进度
            const SIX = this.data.index + 1
            const l = this.data.list.length 
            this.setData({
                currentTimeStr : this.formatTime(num), //进度str
                durationStr : this.formatTime(e) //进度str
            }); 
            if((s-2) == e && e !== NaN && e > 0){
                if(SIX == l){
                    this.setData({
                        index : 0,
                        isPlay:false,
                    });
                }else{
                    this.setData({
                        index : SIX,
                        isPlay:false,
                    });
                }
                this.playBGM(SIX)
                return
            }
            this.setData({
                currentTime : num //进度
            }); 
            console.log(s,e)
          
        },1000)

    },
    next(){
        clearInterval(this.data.time)
        const l =this.data.list.length
        var i = this.data.index + 1

        if(l == i){
            this.setData({
                index:0
            })
            i = 0
        }else{            
            this.setData({
                index:i
            })
        }
        this.playBGM(i)        
    },
    pre(){
        clearInterval(this.data.time)
        const l = this.data.list.length
        var i = this.data.index

        if(i == 0){
            i = l-1
            this.setData({
                index:i
            })
            
        }else{ 
            i--
            this.setData({
                index:i
            })
        }
        //console.log(i)
        this.playBGM(i)
        
    },
    sliderchange(e){
        console.log(e.detail.value)
    },
    playMusic(){
        
        if(this.data.isPlay){
            this.setData({
                isPlay : false
            })
            wx.getBackgroundAudioManager().pause()    
            clearInterval(this.data.time)         
        }else{
            clearInterval(this.data.time) 
            if(wx.getBackgroundAudioManager().title !== undefined ){
                wx.getBackgroundAudioManager().play()
                this.getCurrentTime()
                this.setData({
                    isPlay : true
                })
            }else{   
                this.setData({
                    isPlay : false
                })     
                     
                this.playBGM(this.data.index)
            }
        }
    },
    formatTime(value) {
        var theTime = value;// 秒
        var theTime1 = 0;// 分
        var theTime2 = 0;// 小时
        if(theTime > 60) {
            theTime1 = parseInt(theTime/60);
            theTime = parseInt(theTime%60);
                if(theTime1 > 60) {
                theTime2 = parseInt(theTime1/60);
                theTime1 = parseInt(theTime1%60);
            }
        }
        var result = "";
        if(theTime <= 9){
            result = "0:0"+parseInt(theTime)
        }else if(theTime > 9 && theTime < 59){
            result = "0:"+parseInt(theTime)
        }else{
            result = ""+parseInt(theTime)
        }            
        if(theTime1 > 0) {
            var p = parseInt(theTime1)                
            if(theTime <= 9){
                result = p+":0"+parseInt(theTime)
            }else if(theTime > 9 && theTime < 59){
                result = p+":"+parseInt(theTime)
            }else{
                result = p+parseInt(theTime)
            }  
        }
        if(theTime2 > 0) {
            result = ""+parseInt(theTime2)+":"+result;
        }
        return result;
    },
    onUnload:function(res){
        const that = this
        clearInterval(that.data.time) 
        this.setData({
            time : null
        })  
        wx.setStorage({
            key:'list',
            data:that.data,
            success:function(e){
                console.log(e)
            }
        })

        
    },
    
})