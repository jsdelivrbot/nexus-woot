var Nexus;
if (Nexus === undefined)
    Nexus = {};

if (Nexus['loaded']) {
    console.error('Nexus failed to load, because it has already been loaded once during this session.');
} else {
    $('head').append('<link class="darkcss" href="https://cdn.rawgit.com/zeratul0/plugdj-dark-theme/master/nexus.css" type="text/css" rel="stylesheet" />')
    Nexus = {
        
        loaded: (typeof(Nexus) === "undefined" ? false : Nexus['loaded']),
        
        psDefault: {
            "saveChatAmount":100,
            "MAXMESSAGES":200,
            "autoWoot":true,
            "autoJoin":false,
            "showMeh":true,
            "showGrab":true,
            "allowRepeatMeh":true,
            "allowRepeatGrab":true,
            "showUserJoin":true,
            "showUserLeave":true,
            "showScriptChatMessages":true,
            "showChatUID":true,
            "replaceImgLinks":true,
            "version":"0.12"
        },
        
        plugModulesLoaded:false,
        eventListenersLoaded:false,
        
        ps:{},
        me:{},
        
        rgx:{
            'aimgRegex': new RegExp(/<a(\s+.*?>|>)\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]\.(?:jpe?g|gifv?|png|webm)\b<\/a>/gi)
        },
        
        voters:{
            meh:[],
            grab:[]
        },
        
        fn:{
            
            createEventListeners:function() {
                if (!Nexus['plugModulesLoaded']) {
                    console.error('createModuleListeners failed: plugModules is not loaded!');
                } else if (Nexus['eventListenersLoaded']) {
                    console.error('createModuleListeners failed: Already listening!');
                } else {
                    try {
                        require(['plug-modules!plug/core/Events'], function(e) {
                            e.on('chat:receive',
                                function(k){
                                    Nexus.fn.readChat(k);
                                    Nexus.fn.readAppendChat('.text.cid-'+k.cid);
                                },this)
                             .on('chat:command',
                                function(k){
                                    Nexus.fn.chatCmd(k);
                                }, this)
                            }
                        );
                        Nexus['eventListenersLoaded'] = true;
                    } catch (e) {
                        console.error('createModuleListeners failed: ' + e);
                    }
                }
            },
            
            findUser:function(type, term){
                //arguments: ("id" OR "username"[default]), (int[if type=="id"] OR string[if type=="username"])
                //invalid or no match returns false
                type = type.toLowerCase();
                
                var users,
                    a;
                    
                users = API.getUsers();
                
                if (type === 'id')
                    term = parseInt(term);
                else if (type === 'username')
                    term = term.toLowerCase();
                else return false;
                
                for (var i = 0; i < users.length; i++) {
                    a = users[i][type];
                    if (type === "username")
                        a = a.toLowerCase();
                    if (a === term)
                        return users[i];
                }
                
                return false;
            },
            
            readAppendChat:function(e) {
                setTimeout(function() {
                    var lastText = '';
                    
                    if (Nexus.fn.getPlugSettings()['chatImages'] && Nexus.ps['replaceImgLinks'] && $(e + ' a').length > 0) {
                        $(e).html(
                            $(e).html().replace(Nexus.rgx.aimgRegex, function(g) {
                                    try {
                                        var link = '';
                                        if (g === '')
                                            return;
                                        var video = ['webm', 'gifv'];
                                        link = $(g).attr('href');
                                        if (~video.forIndexOf(link.split('.').arrlast())) {
                                            link = link.substring(0, link.length - 4) + 'webm';
                                            return '<video class="nexus-chat-vid cimg" muted="muted" controls preload="auto"><source src="'+link+'" type="video/webm"></video>';
                                        }
                                        return '<img class="nexus-chat-img cimg" src="'+link+'">';
                                    } catch (g) {
                                        //wait what?
                                        return g;
                                    }
                                })
                        );
                        Nexus.fn.scrollChat();
                    }
                }, 600);
            },
            
            saveSettings:function(){
                localStorage.setItem('nexusSettings', JSON.stringify(Nexus.ps));
                console.log('Settings saved to nexusSettings in localStorage.');
            },
            
            loadSettings:function(){
                var def = Nexus.psDefault;
                var settings = JSON.parse(localStorage.getItem('nexusSettings'));
                if (settings === null)
                    settings = def;
                
                var newver = parseFloat(def['version']);
                var oldver = parseFloat(settings['version']);
                
                if (!isNaN(oldver) && newver > oldver)
                    Nexus.fn.createScriptMsg('Updated from <span style="color:#f00">v'+settings['version']+'</span> to <span style="color: #0f0">v'+def['version']+'</span>!', 'nexus');
                
                settings['version'] = def['version'];
                
                for (var i in def) {
                    if (settings[i] === undefined)
                        settings[i] = def[i];
                }
                
                Nexus.ps = settings;
                console.log('Settings loaded from nexusSettings in localStorage.');
                Nexus.fn.saveSettings();
            },
            
            cleanSettings:function(){
                var def = Nexus.psDefault;
                var settings = Nexus.ps;
                
                
                for (var i in settings) {
                    if (def[i] === undefined) {
                        delete Nexus.ps[i];
                        console.log('cleanSettings: deleted ' + i);
                    }
                }
                
                Nexus.fn.saveSettings();
            },
            
            setTabTitle:function(data){
                
                if (data === undefined)
                    data = {title:'', author:''};
                
                var newTitle,
                    newAuthor;
                    
                if (!data['title'])
                    newTitle = '';
                else {
                    newTitle = data['title'];
                    if (newTitle.length > 55) {
                        newTitle = newTitle.slice(0, 55);
                        newTitle += '...';
                    }
                }
                
                if (!data['author'])
                    newAuthor = '';
                else {
                    newAuthor = data['author'];
                    if (newAuthor.length > 55) {
                        newAuthor = newAuthor.slice(0, 55);
                        newAuthor += '...';
                    }
                }
                
                newTitle += ' - ' + newAuthor;
                
                document.title = decodeURIComponent('%E2%96%B6') + ' ' + newTitle;
            },
            
            getPlugSettings:function(){
                return JSON.parse(localStorage.getItem('settings'))[1][Nexus.me.id];
            },
            
            getTime:function(stamp){
                var date = new Date();
                var time = {h: date.getHours(), m: date.getMinutes(), s: date.getSeconds(), M: date.getMonth() + 1, D: date.getDate(), Y: date.getUTCFullYear(), suffix: 'am'};
                
                if (time.h === 0 || time.h > 12)
                    time.suffix = 'pm';
                if (time.h < 10 && stamp)
                    time.h = '0' + time.h;
                if (time.m < 10)
                    time.m = '0' + time.m;
                if (time.s < 10)
                    time.s = '0' + time.s;
                
                if (stamp)
                    return '['+time.h+':'+time.m+':'+time.s+']';
                
                return time;
            },
            
            createScriptMsg:function(msg, type){ //string (message), string (badge icon name -- 'nexus' is default)
                if (!Nexus.ps['showScriptChatMessages'])
                    return;
                
                var ts = Nexus.fn.getTime(false);
                var display = 'inline';
                var timestamps = Nexus.fn.getPlugSettings()['chatTimestamps'];
                
                if (!type)
                    type = 'nexus';
                
                if (!timestamps)
                    display = 'none';
                else if (timestamps === 12)
                    if (ts.h === 0 || ts.h > 12) ts.h = Math.abs(ts.h - 12);
                ts = ts.h + ':' + ts.m + ts.suffix;
                
                msg = msg.trim();
                
                $('#chat-messages').append('<div class="cm scriptmsg" data-cid="0-0"><div class="delete-button">Remove</div><div class="badge-box '+type+'"><i class="icon icon-'+type+'"></i></div><div class="msg"><div class="from nexus"><span class="un">Nexus</span><span class="timestamp" style="display: '+display+';">'+ts+'</span></div><div class="text">'+msg+'</div></div></div>');  
                Nexus.fn.cutChat();
                Nexus.fn.scrollChat();
            },
            
            woot:function(){
                if (API.getDJ() !== null) $('#woot').click();
            },
            
            joindj:function(){
                if (API.getWaitListPosition() < 0) $('#dj-button.is-wait').click();
            },
            
            toggleSMenu:function(){
                $('#nexus-settings').toggleClass('open');
            },

            createElements:function(){
                
                var toggleStr = {
                    "autoWoot":"Auto Woot",
                    "autoJoin":"Auto DJ",
                    "showMeh":"Show Meh votes",
                    "showGrab":"Show Grabs",
                    "allowRepeatMeh":"Show repeated Meh votes by a user",
                    "allowRepeatGrab":"Show repeated Grabs by a user",
                    "showUserJoin":"Show when users join the room",
                    "showUserLeave":"Show when users leave the room",
                    "showScriptChatMessages":"Show Nexus chat messages",
                    "showChatUID":"Show user IDs in chat",
                    "replaceImgLinks":"Embed images from image links"
                };
                
                var varStr = {
                    "saveChatAmount":{name:"Chat save amount", min:0, max:512},
                    "MAXMESSAGES":{name:"Max chat messages", min:1, max:512}
                };
                
                var makeToggle = function(str, psk, state) { //setting string, internal name for it (Nexus.ps.???), true/false
                    if (state)
                        state = " active";
                    else
                        state = "";
                    
                    var optn = $("<div>", {
                        'class':'nexus-optn',
                        text:str,
                        click: function(){
                            Nexus.ps[psk] = !Nexus.ps[psk];
                            if (Nexus.ps[psk])
                                $(this).find('.orb').addClass('active');
                            else
                                $(this).find('.orb').removeClass('active');
                            Nexus.fn.saveSettings();
                        }
                    }).attr('data', psk)
                        .prepend($("<span>", {
                            'class':'orb'+state
                        })
                            .append($("<span>", {
                                'class':'sub-orb'
                            })));
                    
                    return optn;
                };
                
                var makeVar = function(str, psk, value, min, max) {
                    var input = $("<input>", {
                        'type':'number',
                        'max':max,
                        'min':min,
                        'maxlength':max.length,
                        'size':max.length,
                        'value':value,
                        'data':psk
                    });
                    
                    var sub = $("<span>", {
                        'class':'nexus-sub',
                        text:value
                    });
                    
                    var optn = $("<div>", {
                        'class':'nexus-var',
                        'data':psk
                    })
                        .append($("<span>", {
                            'class':'nexus-var-name',
                            text:str
                        }))
                        .append($("<div>", {
                            'class':'nexus-btn nexus-ui-wrap',
                            click:function(){
                                var val = parseInt(input.val());
                                if (isNaN(val) || val < min || val > max) {
                                    input.val(value);
                                    return;
                                } else {
                                    Nexus.ps[psk] = val;
                                    sub.text(val);
                                    if (psk === 'MAXMESSAGES')
                                        Nexus.fn.cutChat();
                                    Nexus.fn.saveSettings();
                                }
                            }
                        })
                            .append($("<div>", {
                                'class':'nexus-ui',
                                text:'Set'
                            })))
                        .append(input)
                        .append(sub);
                        
                    return optn;
                };
                
                var $innerSB = $("<div>", {
                    'class':'nexus-ui'
                })
                    .append($("<i>", {
                        'class':'icon icon-settings-grey'
                    }));
                
                var $settings = $("<div>", {
                    id:'nexus-settings',
                    'class':'nexus-ui-wrap'
                }).height($('#chat').height() - 12)
                    .append($("<div>", {'class':'nexus-ui'})
                        .append($("<div>", {id:'nexus-menu'})
                            .append($("<div>", {'class':'nexus-optn-header', text:'Nexus Settings'})
                                .prepend($("<span>", {'class':'horiz-border'}))
                                .append($("<span>", {'class':'horiz-border'}))
                            ))
                        .append($("<div>", {
                            id:'nexus-about'
                        })
                            .append($("<span>", {'class':'horiz-border'}))
                            .append($("<div>", {
                                id:'nexus-who',
                                text:'Nexus created by zeratul-'
                            }))
                            .append($("<div>", {
                                id:'nexus-ver',
                                text:'version '+Nexus.ps['version']
                            }))
                        ))
                        
                    .append($("<div>", {
                        id:'nexus-settings-btn',
                        'class':'nexus-ui-wrap',
                        click: function(){Nexus.fn.toggleSMenu()}
                    })
                        .append($innerSB));
                
                $settings.insertAfter($('#vote'));
                        
                for (var i in toggleStr) {
                    if (Nexus.ps[i] === undefined)
                        console.log('Nexus ERROR: value for '+i+' was not found in persistent settings');
                    else {
                        var $opt = makeToggle(toggleStr[i], i, Nexus.ps[i]);
                        $('#nexus-menu').append($opt);
                    }
                }
                
                $('#nexus-menu').append($("<div>", {'class':'nexus-optn-header-2', text:'Variables'})
                                .prepend($("<span>", {'class':'horiz-border'}))
                                .append($("<span>", {'class':'horiz-border'})))
                
                for (var i in varStr) {
                    if (Nexus.ps[i] === undefined)
                        console.log('Nexus ERROR: value for '+i+' was not found in persistent settings');
                    else {
                        var $opt = makeVar(varStr[i]['name'], i, Nexus.ps[i], varStr[i]['min'], varStr[i]['max']);
                        $('#nexus-menu').append($opt);
                    }
                }
            },
            
            scrollChat:function(){
                $('#chat-messages')[0].scrollTop = $('#chat-messages')[0].scrollHeight;
            },
            
            cutChat:function(){
                if (Nexus.ps['MAXMESSAGES'] > 0) {
                    var len = $('#chat-messages').children().length;
                    while (len > Nexus.ps['MAXMESSAGES']) {
                        $('#chat-messages').children()[0].remove();
                        len--;
                    }
                }
            },

            readChat:function(data){
                
                var msg = data.message;
                var selfID = Nexus.me['id'];
                
                if (data.uid === 5698781)
                    $('.cm[data-cid="'+data.cid+'"] .un').last().prepend('<i class="heart"></i>');
                
                $('.cm[data-cid="'+data.cid+'"]').addClass('role-' + Nexus.fn.findUser('id', data.uid).role).addClass('uid-' + data.uid);

                if (Nexus.ps['showChatUID'])
                    $('.msg.cid-'+data.cid+' .from').append($('<span>', {'class':'chat-uid', text:'UID: '+data.uid}));
                
                if (msg.substring(0,4) === '&gt;') {
                    var lasttxt = $('.text.cid-'+data.cid);
                    var x = lasttxt.html().split('<br>');
                    x.arrlast('<span class="greentext">'+x.arrlast()+'</span>');
                    x = x.join('<br>');
                    lasttxt.html(x);
                }
                
                if (data.uid === selfID && $('.cm[data-cid="'+data.cid+'"] .delete-button').length < 1) {
                    $('.cm[data-cid="'+data.cid+'"]').prepend($('<div>', {
                                                        'class':'delete-button',
                                                        'style':'display: none',
                                                        text:'Delete',
                                                        click:function(){API.moderateDeleteChat(data.cid)}}));
                    $('.cm[data-cid="'+data.cid+'"]').addClass('deletable');
                }
                
                Nexus.fn.cutChat();
            },

            advanceSong:function(data) {
                Nexus.voters.meh = [];
                Nexus.voters.grab = [];
                
                
                if (Nexus.ps["autoWoot"])
                    Nexus.fn.woot();
                
                if (Nexus.ps["autoJoin"])
                    Nexus.fn.joindj();
                
                Nexus.fn.setTabTitle(data['media']);
            },
            
            getRoomName:function() {
                var room = location.href.split('/');
                room = room.arrlast();
                return room;
            },
            
            saveOldChat:function(append, clear){
                var chat = $('#chat-messages');
                
                if (Nexus.ps['saveChatAmount'] < 1) {
                    localStorage.setItem(Nexus.fn.getRoomName() + '_oldChat', '');
                    return;
                }
                
                if (chat[0].innerHTML !== '') {
                    var date = Nexus.fn.getTime(false);
                    date = date.M+'/'+date.D+'/'+date.Y+' at '+date.h+':'+date.m+':'+date.s;
                    chat.find('.cm.log').remove();
                    chat.append('<div class="cm log ok"><div class="msg"><div class="text">Above messages saved on '+date+'</div></div></div>');
                    
                    while (chat.children().length > Nexus.ps['saveChatAmount']) {
                        chat.children()[0].remove();
                    }
                    for (var i = 0; i < chat.children().length; i++) {
                        if (!chat.children().eq(i).hasClass('ok'))
                            chat.children().eq(i).addClass('old');
                    }
                }
                
                var msgs = chat[0].innerHTML;
                
                if (append)
                    msgs = localStorage.getItem(Nexus.fn.getRoomName() + '_oldChat') + msgs;
                
                localStorage.setItem(Nexus.fn.getRoomName() + '_oldChat', msgs);
                
                if (clear)
                    chat.empty();
            },
            
            loadOldChat:function(){
                var oldchat = localStorage.getItem(Nexus.fn.getRoomName() + '_oldChat');
                
                if (oldchat === null) oldchat = '';
                
                $('#chat-messages').prepend(oldchat);
                localStorage.setItem(Nexus.fn.getRoomName() + '_oldChat', '');
                Nexus.fn.cutChat();
                Nexus.fn.scrollChat();
            },
            
            setListeners:function(){
                
                $('#chat-messages').on('click', '.deletable.old .delete-button', function() {
                   API.moderateDeleteChat($(this).parent().attr('data-cid'));
                });
                
                $('#chat-messages').on('click', '.scriptmsg .delete-button', function() {
                   $(this).parent().remove();
                });
                
                $(window).on('resize', function() {
                    $('#nexus-settings').height($('#chat').height() - 12);
                });
                
            },
            
            handleVoteUpdate:function(data){
                var id,
                    voters,
                    voted,
                    media;
                    
                id = data.user.id;
                
                if (data.vote === -1) {
                    
                    voters = Nexus.voters.meh;
                    
                    voted = ~voters.forIndexOf(id);
                
                    if (!Nexus.ps['allowRepeatMeh'] && voted)
                        return;
                    
                    if (!voted)
                        voters.push(id);
                    
                    if (Nexus.ps['showMeh']) {
                        media = API.getMedia();
                        Nexus.fn.createScriptMsg('<span class="smsg-user uid-'+id+'">'+ data.user.username + '</span> <span class="smsg-meh">meh\'d</span> <span class="smsg-author">'+media.author+'</span> - <span class="smsg-title">'+media.title+'</span>', 'meh');
                    }
                }
            },
            
            handleGrab:function(data){
                var id,
                    voters,
                    voted,
                    media;
                    
                id = data.user.id;
                    
                voters = Nexus.voters.grab;
                
                voted = ~voters.forIndexOf(id);
                
                if (!Nexus.ps['allowRepeatGrab'] && voted)
                    return;
                
                if (!voted)
                    voters.push(id);
                
                if (Nexus.ps['showGrab']) {
                    media = API.getMedia();
                    Nexus.fn.createScriptMsg('<span class="smsg-user uid-'+id+'">'+data.user.username+'</span> <span class="smsg-grab">grabbed</span> <span class="smsg-author">'+media.author+'</span> - <span class="smsg-title">'+media.title+'</span>', 'grab');
                }
            },
            
            removeUser:function(data){
                if (Nexus.ps['showUserLeave'])
                    Nexus.fn.createScriptMsg('<span class="smsg-userleft">- <span class="smsg-userleft-un uid-'+data.id+'">'+data.username+'</span> left.</span>', 'nexus');
            },
            
            addUser:function(data){
                if (Nexus.ps['showUserJoin'])
                    Nexus.fn.createScriptMsg('<span class="smsg-userjoined">+ <span class="smsg-userjoined-un uid-'+data.id+'">'+data.username+'</span> joined.</span>', 'nexus');
            },

            load:function(){
                if (Nexus['loaded']) {
                    console.error('Nexus failed to load, because it has already been loaded once during this session.');
                    return;
                } else {
                    Nexus['loaded'] = true;
                    
                    try {
                        window.requirejs.config({ //plug-modules by goto-bus-stop
                            paths: {
                                'plug-modules': 'https://unpkg.com/plug-modules/plug-modules'
                            }
                        });
                        Nexus['plugModulesLoaded'] = true;
                    } catch (e) {
                        console.error('Nexus error running plugModules: ' + e);
                    }

                    String.prototype.repeat = function(num) {
                        return new Array(num + 1).join(this);
                    };
                    
                    String.prototype.forIndexOf = function(str) {
                        if (typeof(str) !== "string")
                            return -1;
                        
                        for (var i = 0; i < this.length; i++) {
                            if (this.slice(i,i+str.length) == str)
                                return i;
                        }
                        return -1;
                    };
                    
                    Array.prototype.forIndexOf = function(item) {
                        for (var i = 0; i < this.length; i++) {
                            if (this[i] === item)
                                return i;
                        }
                        return -1;
                    };
                    
                    Array.prototype.arrlast = function() {
                        if (arguments[0] !== undefined) {
                            this[this.length-1] = arguments[0];
                            return void(0);
                        }
                        return this[this.length - 1];
                    };
                    
                    API.on(API.ADVANCE, function(data) {Nexus.fn.advanceSong(data)});
                    API.on(API.USER_LEAVE, function(data) {Nexus.fn.removeUser(data)});
                    API.on(API.USER_JOIN, function(data) {Nexus.fn.addUser(data)});
                    API.on(API.VOTE_UPDATE, function(data) {Nexus.fn.handleVoteUpdate(data)});
                    API.on(API.GRAB_UPDATE, function(data) {Nexus.fn.handleGrab(data)});
                    Nexus.fn.createEventListeners();
                    Nexus.fn.loadSettings();
                    Nexus.fn.loadOldChat();
                    Nexus.fn.setListeners();
                    Nexus['me'] = API.getUser();
                    Nexus.fn.createElements();
                    $(window).unload(function() {Nexus.fn.saveSettings(); Nexus.fn.saveOldChat(false, false)});
                    Nexus.fn.advanceSong({media:API.getMedia()});
                    Nexus.fn.scrollChat();
                }
            }
            
        }
        
    }
    Nexus.fn.load();
}
