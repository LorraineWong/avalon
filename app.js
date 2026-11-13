/* Avalon Online — static client. Realtime via Firebase Realtime Database (anonymous auth).
 * Architecture:
 *  - Every player signs in anonymously (Firebase uid) and keeps an ECDH key pair in localStorage.
 *  - Database security rules: only the host writes the game state and secrets; each player writes only their own seat.
 *  - The host's browser runs the game engine; actions are encrypted to the host and
 *    roles are encrypted to each player, so nobody can read others' roles from the database.
 */
'use strict';

/* ================= i18n ================= */
const I18N = {
  zh: {
    sub:'阿瓦隆 · 在线版', tagline:'抵抗组织：阿瓦隆', feat1:'5–10 人', feat2:'无需注册', feat3:'手机电脑都能玩', feat4:'身份加密，无法偷看',
    nick:'你的昵称', nickPh:'比如：小明', create:'创建房间', joinTitle:'加入房间', codePh:'房间号', join:'加入',
    joinHint:'输入朋友发来的房间号，或直接打开邀请链接。', resume:'你上次在房间 {0}', resumeBtn:'回到房间',
    needNick:'请先填写昵称', badCode:'请输入正确的房间号', notFound:'房间 {0} 不存在或已解散',
    connecting:'连接服务器中…', online:'已连接', offline:'连接断开，重连中…', noNet:'无法连接游戏服务器，请检查网络后刷新。',
    entering:'正在进入房间 {0}…', home:'首页', roomCode:'房间号', copyLink:'复制邀请链接', copied:'邀请链接已复制',
    share:'分享', showQR:'扫码加入', scanJoin:'扫描二维码加入房间', inviteHint:'把链接发给朋友，打开就能加入。', players:'玩家', host:'房主', you:'你', seat:'入座', rename:'改名',
    leave:'离开房间', start:'开始游戏', dealing:'发牌中…', waitHost:'等待房主开始游戏…', full:'房间已满（最多 10 人）',
    renamed:'昵称已更新', roleSettings:'角色配置', hostOnly:'仅房主可修改', advancedRoles:'高级角色配置', advancedRolesHint:'需要逐个调整角色或玩法模块时再展开', emptySeat:'等待加入', presets:'推荐配置', presetNew:'新手局', presetClassic:'经典局', presetBig:'扩展局', presetApplied:'已应用「{0}」配置',
    needPlayers:'需要 5–10 名玩家（当前 {0} 人）', tooManyEvil:'{0} 人局只有 {1} 个坏人，勾选的坏人角色太多了', tooManyGood:'好人特殊角色太多了',
    comp:'{0} 人局：{1} 好人 · {2} 坏人', compPrev:'按 {0} 人预览：{1} 好人 · {2} 坏人',
    optMerlin:'梅林 + 刺客', optMerlinD:'经典核心', optLady:'湖中仙女', optLadyD:'7 人及以上生效', optExcalibur:'王者之剑', optExcaliburD:'持剑者可换掉另一名队员的任务牌',
    optLancelot:'兰斯洛特', optLancelotD:'一好一坏，互相认识', optLancelotSwitch:'兰斯洛特·效忠转换', optLancelotSwitchD:'每个任务开始时抽效忠牌；两人互不认识',
    ph_propose:'组队', ph_vote:'投票', ph_quest:'出任务', ph_excalibur:'王者之剑', ph_loyalty:'阵营查验', ph_recruit:'招募判定', ph_lady:'湖中仙女', ph_assassin:'刺杀梅林', ph_end:'游戏结束',
    questN:'任务 {0}', attempt:'第 {0}/5 次组队', needTwo:'需 2 张失败', fails:'{0} 张失败', score:'当前比分', goodNeeds:'好人还需 {0} 次成功', evilNeeds:'坏人还需 {0} 次失败', waitingFor:'等待', allDone:'行动已完成，正在结算…', offlinePlayer:'离线',
    leaderPick:'你是队长：选 {0} 名队员', leaderHint:'点击圆桌上的玩家选择，可以选自己。', submitTeam:'提交队伍', resubmit:'重新提交', selectedTeam:'已选队伍', tapRemove:'点击头像可取消', confirmTeam:'确认派出这支队伍：{0}？', confirmTeamAction:'确认派出',
    waitLeader:'{0} 正在挑选 {1} 名队员', discuss:'队长的暂选名单会实时显示，趁现在讨论一下吧。', leaderDraft:'队长目前暂选', voteTitle:'同意这支队伍出发吗？',
    approve:'赞成', reject:'反对', voted:'已投票，所有人投完前可以修改。', pleaseVote:'请投票，全部投完后统一公开。', votedCount:'已投 {0}/{1}',
    questTitle:'任务进行中', success:'成功', fail:'失败', goodOnly:'好人只能出“成功”。', evilChoice:'你是坏人，可以选择让任务失败。', mustFail:'你的身份在本次任务必须出“失败”。', cannotFail:'你的身份在本次任务不能出“失败”。', confirmQuest:'确认任务牌', confirmQuestHint:'选定后会立即提交，其他玩家只会看到最终统计。', confirmSuccess:'确认提交成功', confirmFail:'确认提交失败', changeChoice:'重新选择',
    excaliburPick:'把王者之剑交给一名队员', excaliburHint:'持剑者不能是队长，出牌后可换掉另一名队员的牌。', excaliburUse:'要换掉谁的任务牌？', excaliburSkip:'不使用王者之剑', excaliburWait:'{0} 正在决定是否使用王者之剑…',
    loyaltyChoose:'你的阵营正在被查验', loyaltyHint:'骗术师可以向查验者展示任意阵营。', showGood:'展示好人', showEvil:'展示坏人', loyaltyWait:'等待被查验者选择要展示的阵营…',
    recruitTitle:'刺客先寻找“不可信的仆人”', recruitMe:'选出你认为的不可信仆人。猜中后，他会倒戈并接替你刺杀梅林；猜错则仍由你刺杀。', recruitWait:'刺客正在尝试招募不可信的仆人…',
    played:'已出牌 {0}/{1}', youPlayed:'你已出牌。', waitTeam:'等待队员出牌…', twoNote:'本任务需要 2 张失败才算失败。',
    ladyTitle:'湖中仙女：查验一名玩家', ladyHint:'点击圆桌上的玩家（持有过仙女的人不能选）。', inspect:'查验 {0}', ladyWait:'{0} 正在使用湖中仙女…',
    assTitle:'好人完成了 3 个任务！', assMe:'你是刺客：和队友商量后，选出你认为的梅林。', stab:'刺杀 {0}', assWait:'刺客正在寻找梅林…', assEvil:'坏人可以公开讨论刺谁。',
    spectator:'你正在观战', myRole:'我的身份与能力', tapReveal:'查看身份与能力', yourRole:'你的身份', youSee:'你看到的{0}', none:'无',
    inspected:'你查验了 {0}：{1}', good:'好人', evil:'坏人', currentLoyalty:'当前阵营：{0}', gotIt:'我记住了', loadingRole:'正在读取身份…',
    see_evil:'坏人', see_mp:'梅林或莫甘娜', see_allies:'坏人同伴', see_assassin:'刺客', see_lancelot:'另一名兰斯洛特', see_lancelot_allies:'另一名兰斯洛特与坏人同伴', nightTitle:'夜晚降临', nightLead:'悄悄看一下你的身份，别让旁边的人看到。', flip:'翻开身份牌',
    voteReveal:'投票结果', passed:'队伍通过，出发！', rejected:'队伍被否决', yesNo:'{0} 赞成 · {1} 反对',
    questReveal:'任务 {0} 结果', qSuccess:'任务成功', qFail:'任务失败',
    goodWin:'好人阵营获胜', evilWin:'坏人阵营获胜', r5:'连续 5 次组队被否决', r3f:'3 个任务失败', r3s:'3 个任务成功', recruited:'不可信的仆人已倒戈', revealerShown:'揭示者公开了身份', lancelotSwitchLog:'兰斯洛特转换了阵营', lancelotNoChange:'兰斯洛特阵营不变',
    rhit:'杀对了：刺杀命中梅林，坏人翻盘！', rmiss:'杀错了：目标不是梅林，好人获胜！', stabbedX:'刺客刺杀了 {0}', assResult:'刺杀结果', assHit:'杀对了！刺杀命中梅林', assMiss:'杀错了！目标不是梅林', revealedAs:'真实身份：{1}',
    again:'再来一局', waitAgain:'等待房主开新局', backHome:'回首页', allRoles:'身份揭晓',
    history:'对局记录', noHistory:'还没有投票记录。', round:'轮次', leaderTeam:'队长 / 队伍', result:'结果',
    rRejected:'否决', rOn:'出发中', try:'第 {0} 次',
    hostOffline:'房主 {0} 似乎掉线了。为保护隐藏身份，意外掉线后不能自动接管；请房主重新打开链接。', hostTools:'房主管理', transferHost:'转交房主', transferTo:'选择新房主', transferWarning:'转交后由对方设备推进游戏；你的主密钥会安全地重新加密给对方。', confirmTransfer:'确认转交给 {0}', hostTransferred:'房主已转交给 {0}', hostChanged:'房主已转交', chooseHost:'请先选择一名在线玩家',
    privacyCover:'遮挡屏幕', revealScreen:'恢复游戏', coveredTitle:'私人信息已遮挡', coveredHint:'只有点击下方按钮才会重新显示身份、技能与笔记。',
    rules:'规则速查', close:'关闭', goodCamp:'正义阵营', evilCamp:'邪恶阵营', gameModules:'组合角色与玩法模块', currentLineup:'本局角色', lineupHint:'只显示这局会出现的身份；不会显示谁拿到哪个身份。', lineupPreview:'当前人数不足，先按 {0} 人阵容预览。', lobbyGuideHint:'角色说明与完整玩法改为按需查看，不再占满大厅。', openLineup:'查看本局角色', fullRules:'完整规则', allRoleGuide:'全部角色说明', rulesAnytime:'规则与角色', ladyLog:'湖中仙女', kicked:'已移出', toMany:'最多选 {0} 人，先取消一个', confirmTitle:'请确认操作', confirm:'确认', cancel:'取消', confirmKick:'确定将 {0} 移出房间吗？', confirmLeave:'确定离开正在进行的游戏吗？重新打开邀请链接仍可回来。', confirmAgain:'确定结束本局结果并返回大厅吗？', confirmAssassin:'确认刺杀 {0}？提交后会立即决定胜负，无法撤销。', confirmExcalibur:'确认替换 {0} 的任务牌？提交后无法撤销。',
    howToPlay:'一局怎么进行', step1Title:'1 · 队长组队', step1Body:'队长按当前任务要求选择队员，可以选择自己。', step2Title:'2 · 全员投票', step2Body:'超过半数赞成，队伍才能出发。一个任务连续 5 次组队被否决，坏人直接获胜。', step3Title:'3 · 秘密任务', step3Body:'获选队员秘密出牌：好人只能出成功，坏人可以出失败。7 人及以上的第 4 个任务需要 2 张失败。', step4Title:'4 · 决定胜负', step4Body:'坏人让 3 个任务失败即获胜；好人完成 3 个任务后，刺客仍可通过刺中梅林翻盘。',
    privateNotes:'私人推理笔记', openNotes:'打开私人笔记', closeNotes:'收起私人笔记', notesHint:'只保存在这台设备，不会上传，也不会让房主或其他玩家看到。', suspectAs:'怀疑身份', unmarked:'未标记', leanGood:'偏好人', leanEvil:'偏坏人', notePlaceholder:'记录发言、投票或你的推理…', clearNotes:'清空本局笔记', notesCleared:'本局私人笔记已清空',
    rulesP1:'好人要完成 3 个任务，坏人要让 3 个任务失败。每轮由队长挑选队员，所有人公开投票，<b>超过半数</b>赞成才能出发，否则队长顺延到下一位。同一个任务<b>连续 5 次</b>组队被否决，坏人直接获胜。',
    rulesP2:'出任务时队员秘密出牌：好人只能出“成功”，坏人可以选择。7 人及以上时，<b>第 4 个任务需要 2 张失败</b>才算失败。好人完成 3 个任务后，刺客还有一次刺杀梅林的机会，刺中则坏人翻盘。',
    rulesP3:'湖中仙女（可选，7 人以上）：第 2、3、4 个任务结束后，持有者秘密查验一名玩家的阵营，然后把仙女交给对方。持有过仙女的人不能再被查验。',
    rulesP4:'人数配置：5 人 3 好 2 坏 · 6 人 4 好 2 坏 · 7 人 4 好 3 坏 · 8 人 5 好 3 坏 · 9 人 6 好 3 坏 · 10 人 6 好 4 坏',
    writeFail:'保存失败，请检查网络后重试', footer:'非官方粉丝作品，与原版游戏发行方无关联。相关名称与设定权利归各自权利人所有。', privacy:'隐私', legal:'非官方声明', support:'支持开发', react:'圆桌表情', reactHint:'只显示几秒，不保存聊天记录', reactAgree:'赞成', reactThink:'思考', reactSus:'怀疑', reactShock:'震惊', reactLaugh:'大笑', reactSword:'出发', tooLong:'昵称最多 12 个字',
  },
  en: {
    sub:'Avalon · Online', tagline:'The Resistance: Avalon', feat1:'5–10 players', feat2:'No sign-up', feat3:'Phone & desktop', feat4:'Encrypted roles',
    nick:'Your name', nickPh:'e.g. Alex', create:'Create room', joinTitle:'Join a room', codePh:'Room code', join:'Join',
    joinHint:'Enter the code a friend sent you, or just open their invite link.', resume:'You were in room {0}', resumeBtn:'Rejoin',
    needNick:'Please enter your name first', badCode:'Please enter a valid room code', notFound:'Room {0} does not exist or was closed',
    connecting:'Connecting…', online:'Online', offline:'Connection lost, reconnecting…', noNet:'Cannot reach the game server. Check your network and refresh.',
    entering:'Joining room {0}…', home:'Home', roomCode:'Room code', copyLink:'Copy invite link', copied:'Invite link copied',
    share:'Share', showQR:'Join QR', scanJoin:'Scan to join this room', inviteHint:'Send the link to friends — opening it joins the room.', players:'Players', host:'Host', you:'You', seat:'Take a seat', rename:'Rename',
    leave:'Leave room', start:'Start game', dealing:'Dealing…', waitHost:'Waiting for the host to start…', full:'Room is full (max 10)',
    renamed:'Name updated', roleSettings:'Roles', hostOnly:'Host only', advancedRoles:'Advanced role setup', advancedRolesHint:'Expand only when you need to adjust individual roles or modules', emptySeat:'Open seat', presets:'Recommended setups', presetNew:'Beginner', presetClassic:'Classic', presetBig:'Expansion', presetApplied:'Applied “{0}” setup',
    needPlayers:'Need 5–10 players (now {0})', tooManyEvil:'A {0}-player game has only {1} evil players — too many evil roles selected', tooManyGood:'Too many special good roles',
    comp:'{0} players: {1} good · {2} evil', compPrev:'Preview for {0}: {1} good · {2} evil',
    optMerlin:'Merlin + Assassin', optMerlinD:'The classic core', optLady:'Lady of the Lake', optLadyD:'7+ players', optExcalibur:'Excalibur', optExcaliburD:'Its holder may switch another member\'s Quest card',
    optLancelot:'Lancelots', optLancelotD:'One Good and one Evil; they know each other', optLancelotSwitch:'Lancelot allegiance variant', optLancelotSwitchD:'Reveal an Allegiance card before each Quest; they do not know each other',
    ph_propose:'Team building', ph_vote:'Voting', ph_quest:'Quest', ph_excalibur:'Excalibur', ph_loyalty:'Loyalty check', ph_recruit:'Recruitment', ph_lady:'Lady of the Lake', ph_assassin:'Assassination', ph_end:'Game over',
    questN:'Quest {0}', attempt:'Proposal {0}/5', needTwo:'Needs 2 fails', fails:'{0} fail(s)', score:'Score', goodNeeds:'Good needs {0} more success(es)', evilNeeds:'Evil needs {0} more fail(s)', waitingFor:'Waiting for', allDone:'Actions complete — resolving…', offlinePlayer:'offline',
    leaderPick:'You lead: pick {0} players', leaderHint:'Tap players around the table. You may pick yourself.', submitTeam:'Propose team', resubmit:'Propose again', selectedTeam:'Selected team', tapRemove:'Tap a portrait to remove', confirmTeam:'Send this team: {0}?', confirmTeamAction:'Send team',
    waitLeader:'{0} is picking {1} players', discuss:'The Leader’s draft team appears live. Discuss while they decide.', leaderDraft:'Leader’s current draft', voteTitle:'Approve this team?',
    approve:'Approve', reject:'Reject', voted:'Vote cast — you can change it until everyone has voted.', pleaseVote:'Cast your vote. All votes are revealed together.', votedCount:'Voted {0}/{1}',
    questTitle:'Quest in progress', success:'Success', fail:'Fail', goodOnly:'Good players can only play Success.', evilChoice:'You are evil — you may sabotage.', mustFail:'Your role must play Fail on this Quest.', cannotFail:'Your role cannot play Fail on this Quest.', confirmQuest:'Confirm Quest card', confirmQuestHint:'This submits immediately. Other players only see the final count.', confirmSuccess:'Submit Success', confirmFail:'Submit Fail', changeChoice:'Choose again',
    excaliburPick:'Give Excalibur to a team member', excaliburHint:'The Leader cannot hold it. After cards are played, its holder may switch another member\'s card.', excaliburUse:'Whose Quest card will you switch?', excaliburSkip:'Do not use Excalibur', excaliburWait:'{0} is deciding whether to use Excalibur…',
    loyaltyChoose:'Your loyalty is being checked', loyaltyHint:'The Trickster may show either loyalty to the examiner.', showGood:'Show Good', showEvil:'Show Evil', loyaltyWait:'Waiting for the checked player to choose a loyalty…',
    recruitTitle:'The Assassin first seeks the Untrustworthy Servant', recruitMe:'Choose the Untrustworthy Servant. If correct, they turn Evil and take over the assassination; if wrong, you still hunt Merlin.', recruitWait:'The Assassin is attempting to recruit the Untrustworthy Servant…',
    played:'Played {0}/{1}', youPlayed:'Card played.', waitTeam:'Waiting for the team…', twoNote:'This quest needs 2 fails to fail.',
    ladyTitle:'Lady of the Lake: inspect a player', ladyHint:'Tap a player (former holders cannot be chosen).', inspect:'Inspect {0}', ladyWait:'{0} is using the Lady of the Lake…',
    assTitle:'Good completed 3 quests!', assMe:'You are the Assassin: confer with your team and choose who you think is Merlin.', stab:'Assassinate {0}', assWait:'The Assassin is hunting for Merlin…', assEvil:'Evil may discuss openly.',
    spectator:'You are spectating', myRole:'My role & ability', tapReveal:'View role & ability', yourRole:'Your role', youSee:'You see ({0})', none:'nobody',
    inspected:'You inspected {0}: {1}', good:'Good', evil:'Evil', currentLoyalty:'Current loyalty: {0}', gotIt:'Got it', loadingRole:'Loading your role…',
    see_evil:'evil', see_mp:'Merlin or Morgana', see_allies:'evil allies', see_assassin:'the Assassin', see_lancelot:'the other Lancelot', see_lancelot_allies:'the other Lancelot and evil allies', nightTitle:'Night falls', nightLead:'Peek at your role — keep it hidden from anyone next to you.', flip:'Reveal my role',
    voteReveal:'Vote results', passed:'Team approved — off they go!', rejected:'Team rejected', yesNo:'{0} approve · {1} reject',
    questReveal:'Quest {0} result', qSuccess:'Quest succeeded', qFail:'Quest failed',
    goodWin:'Good wins', evilWin:'Evil wins', r5:'5 proposals in a row were rejected', r3f:'3 quests failed', r3s:'3 quests succeeded', recruited:'The Untrustworthy Servant changed sides', revealerShown:'The Revealer exposed their identity', lancelotSwitchLog:'The Lancelots switched allegiance', lancelotNoChange:'The Lancelots kept their allegiance',
    rhit:'Correct target: the Assassin found Merlin, so Evil steals the win!', rmiss:'Wrong target: the Assassin missed Merlin, so Good wins!', stabbedX:'The Assassin chose {0}', assResult:'Assassination result', assHit:'Correct! Merlin was assassinated', assMiss:'Wrong! The target was not Merlin', revealedAs:'True role: {1}',
    again:'Play again', waitAgain:'Waiting for the host', backHome:'Home', allRoles:'Roles revealed',
    history:'History', noHistory:'No votes yet.', round:'Round', leaderTeam:'Leader / Team', result:'Result',
    rRejected:'Rejected', rOn:'On quest', try:'Try {0}',
    hostOffline:'Host {0} seems offline. To protect hidden roles, an unexpected disconnect cannot be taken over automatically; ask the host to reopen the link.', hostTools:'Host controls', transferHost:'Transfer host', transferTo:'Choose the new host', transferWarning:'Their device will advance the game. Your master key is securely re-encrypted for them.', confirmTransfer:'Confirm transfer to {0}', hostTransferred:'Host transferred to {0}', hostChanged:'Host transferred', chooseHost:'Choose an online player first',
    privacyCover:'Hide screen', revealScreen:'Return to game', coveredTitle:'Private information hidden', coveredHint:'Your role, knowledge, and notes stay covered until you return.',
    rules:'Quick rules', close:'Close', goodCamp:'Good', evilCamp:'Evil', gameModules:'Paired roles & game modules', currentLineup:'This game’s roles', lineupHint:'Only roles present in this game are shown; player assignments stay hidden.', lineupPreview:'Not enough players yet — previewing the {0}-player lineup.', lobbyGuideHint:'Role explanations and full rules now open only when needed.', openLineup:'View this game’s roles', fullRules:'Full rules', allRoleGuide:'All role descriptions', rulesAnytime:'Rules & roles', ladyLog:'Lady of the Lake', kicked:'Removed', toMany:'Max {0} players — deselect one first', confirmTitle:'Confirm action', confirm:'Confirm', cancel:'Cancel', confirmKick:'Remove {0} from the room?', confirmLeave:'Leave this game in progress? You can return with the invite link.', confirmAgain:'End this result and return everyone to the lobby?', confirmAssassin:'Assassinate {0}? This decides the game immediately and cannot be undone.', confirmExcalibur:'Switch {0}’s Quest card? This cannot be undone.',
    howToPlay:'How a game works', step1Title:'1 · Build a team', step1Body:'The Leader picks the required number of players and may pick themself.', step2Title:'2 · Everyone votes', step2Body:'The team needs a strict majority to go. Five rejected proposals on one Quest give Evil an immediate win.', step3Title:'3 · Play Quest cards secretly', step3Body:'Selected players submit in secret: Good can only play Success; Evil may play Fail. With 7+ players, Quest 4 needs two Fails.', step4Title:'4 · Decide the winner', step4Body:'Evil wins after three failed Quests. After three successes, the Assassin can still steal the win by finding Merlin.',
    privateNotes:'Private deduction notes', openNotes:'Open private notes', closeNotes:'Hide private notes', notesHint:'Saved only on this device. Nothing is uploaded or shared with the host or other players.', suspectAs:'Suspected role', unmarked:'Unmarked', leanGood:'Leans Good', leanEvil:'Leans Evil', notePlaceholder:'Record claims, votes, or your reasoning…', clearNotes:'Clear notes for this game', notesCleared:'Private notes for this game were cleared',
    rulesP1:'Good must complete 3 quests; Evil must fail 3. Each round the leader proposes a team and everyone votes openly — a <b>strict majority</b> is needed, otherwise leadership passes on. If <b>5 proposals in a row</b> are rejected for one quest, Evil wins.',
    rulesP2:'Team members play cards secretly: Good can only play Success, Evil may choose. With 7+ players, <b>Quest 4 needs 2 fails</b>. If Good completes 3 quests, the Assassin gets one shot at Merlin — a hit means Evil wins.',
    rulesP3:'Lady of the Lake (optional, 7+): after Quests 2, 3 and 4 the holder secretly checks one player\'s loyalty, then passes the Lady to them. Former holders cannot be checked.',
    rulesP4:'Teams: 5p 3G/2E · 6p 4G/2E · 7p 4G/3E · 8p 5G/3E · 9p 6G/3E · 10p 6G/4E',
    writeFail:'Could not save — check your network and try again', footer:'Unofficial fan project, not affiliated with the original game publisher. Names and settings belong to their respective owners.', privacy:'Privacy', legal:'Unofficial notice', support:'Support development', react:'Table reactions', reactHint:'Shown briefly; no chat history is stored', reactAgree:'Agree', reactThink:'Thinking', reactSus:'Suspicious', reactShock:'Shocked', reactLaugh:'Laugh', reactSword:'Onward', tooLong:'Name: max 12 characters',
  }
};
const REACTIONS = [
  {id:'agree', emoji:'👍', label:'reactAgree'}, {id:'think', emoji:'🤔', label:'reactThink'},
  {id:'sus', emoji:'🤨', label:'reactSus'}, {id:'shock', emoji:'😱', label:'reactShock'},
  {id:'laugh', emoji:'😂', label:'reactLaugh'}, {id:'sword', emoji:'⚔️', label:'reactSword'}
];
const REACTION_MS = 5000;
const ROLE_TXT = {
  zh: {
    merlin:['梅林','你知道谁是坏人（莫德雷德除外）。别暴露自己，否则好人赢了也会被刺客翻盘。'],
    percival:['派西维尔','你能看到梅林和莫甘娜，但分不清谁是谁。保护真正的梅林。'],
    servant:['亚瑟的忠臣','你没有额外信息，靠发言和投票找出坏人。'],
    assassin:['刺客','好人完成 3 个任务后，由你刺杀一名玩家：刺中梅林，坏人翻盘。'],
    morgana:['莫甘娜','在派西维尔眼中，你看起来和梅林一样。'],
    mordred:['莫德雷德','梅林看不到你是坏人。'],
    oberon:['奥伯伦','你不认识其他坏人，他们也不认识你（但梅林能看到你）。'],
    minion:['莫德雷德的爪牙','你认识其他坏人（奥伯伦除外），想办法让任务失败。'],
    lancelotGood:['善良兰斯洛特','你属于好人阵营。基础玩法中你与邪恶兰斯洛特互相认识。'],
    lancelotEvil:['邪恶兰斯洛特','你属于坏人阵营。基础玩法中你与善良兰斯洛特互相认识。'],
    lunatic:['疯子','你属于坏人；只要参加任务就必须出“失败”。'],
    brute:['蛮兵','你属于坏人；只有前三个任务可以出“失败”。'],
    revealer:['揭示者','你属于坏人；第二个失败任务结算后必须公开身份。'],
    cleric:['牧师','开局时你会得知初始队长属于好人还是坏人。'],
    trickster:['骗术师','你属于坏人；阵营被查验时可以展示好人或坏人。'],
    troublemaker:['捣乱者','你属于好人；阵营被查验时必须显示为坏人。'],
    untrustworthy:['不可信的仆人','你属于好人并认识刺客，但梅林把你看成坏人。三次任务成功后，刺客会先尝试招募你。'],
  },
  en: {
    merlin:['Merlin','You know the evil players (except Mordred). Stay hidden — if the Assassin finds you, Evil wins.'],
    percival:['Percival','You see Merlin and Morgana, but cannot tell which is which. Protect the real Merlin.'],
    servant:['Loyal Servant','No special knowledge. Use discussion and votes to find the traitors.'],
    assassin:['Assassin','If Good completes 3 quests, you pick one player to assassinate. Hit Merlin and Evil wins.'],
    morgana:['Morgana','You appear as Merlin to Percival.'],
    mordred:['Mordred','Merlin cannot see you as evil.'],
    oberon:['Oberon','You do not know the other evil players and they do not know you (Merlin does see you).'],
    minion:['Minion of Mordred','You know your evil allies (except Oberon). Sabotage the quests.'],
    lancelotGood:['Good Lancelot','You are Good. In the base Lancelot rules, you and Evil Lancelot know each other.'],
    lancelotEvil:['Evil Lancelot','You are Evil. In the base Lancelot rules, you and Good Lancelot know each other.'],
    lunatic:['Lunatic','You are Evil and must play Fail on every Quest you join.'],
    brute:['Brute','You are Evil but may play Fail only on the first three Quests.'],
    revealer:['Revealer','You are Evil and must expose your identity after the second failed Quest.'],
    cleric:['Cleric','At the start of the game, you learn whether the initial Leader is Good or Evil.'],
    trickster:['Trickster','You are Evil and may show either loyalty whenever your loyalty is checked.'],
    troublemaker:['Troublemaker','You are Good but must show Evil whenever your loyalty is checked.'],
    untrustworthy:['Untrustworthy Servant','You are Good and know the Assassin, but Merlin sees you as Evil. After three successful Quests, the Assassin first tries to recruit you.'],
  }
};
const ROLE_META = {
  merlin:{side:'good',ic:'✦',art:'assets/roles/merlin.webp'},
  percival:{side:'good',ic:'◈',art:'assets/roles/percival.webp'},
  servant:{side:'good',ic:'⚔',art:'assets/roles/servant.webp'},
  assassin:{side:'evil',ic:'†',art:'assets/roles/assassin.webp'},
  morgana:{side:'evil',ic:'☾',art:'assets/roles/morgana.webp'},
  mordred:{side:'evil',ic:'♜',art:'assets/roles/mordred.webp'},
  oberon:{side:'evil',ic:'♠',art:'assets/roles/oberon.webp'},
  minion:{side:'evil',ic:'◆',art:'assets/roles/minion.webp'},
  lancelotGood:{side:'good',ic:'♞',art:'assets/roles/lancelot-good.webp'},
  lancelotEvil:{side:'evil',ic:'♞',art:'assets/roles/lancelot-evil.webp'},
  lunatic:{side:'evil',ic:'☄',art:'assets/roles/lunatic.webp'},
  brute:{side:'evil',ic:'⚒',art:'assets/roles/brute.webp'},
  revealer:{side:'evil',ic:'◉',art:'assets/roles/revealer.webp'},
  cleric:{side:'good',ic:'☩',art:'assets/roles/cleric.webp'},
  trickster:{side:'evil',ic:'☿',art:'assets/roles/trickster.webp'},
  troublemaker:{side:'good',ic:'⚡',art:'assets/roles/troublemaker.webp'},
  untrustworthy:{side:'good',ic:'⚜',art:'assets/roles/untrustworthy.webp'},
};
let LANG = 'zh';
function t(k, ...a){ const s = (I18N[LANG][k] ?? I18N.zh[k] ?? k); return s.replace(/\{(\d)\}/g, (_,i)=>a[+i] ?? ''); }
const rName = r => ROLE_TXT[LANG][r][0];
const rDesc = r => ROLE_TXT[LANG][r][1];
const side = r => ROLE_META[r] ? ROLE_META[r].side : null;
const roleArt = (r, cls='role-art') => '<img class="'+cls+'" src="'+ROLE_META[r].art+'" alt="'+esc(rName(r))+'" loading="lazy">';

/* ================= Rules ================= */
const EVIL_N = {5:2,6:2,7:3,8:3,9:3,10:4};
const SIZES  = {5:[2,3,2,3,3],6:[2,3,4,3,4],7:[2,3,3,4,4],8:[3,4,4,5,5],9:[3,4,4,5,5],10:[3,4,4,5,5]};
const DEFAULT_SETTINGS = {
  merlin:true, percival:true, morgana:true, mordred:false, oberon:false,
  lancelot:false, lancelotSwitch:false, lunatic:false, brute:false, revealer:false,
  cleric:false, trickster:false, troublemaker:false, untrustworthy:false,
  lady:false, excalibur:false
};
function presetSettings(id,n){
  const st=Object.assign({},DEFAULT_SETTINGS,{percival:false,morgana:false});
  if(id==='classic'){ st.percival=true; st.morgana=true; }
  if(id==='big'){
    st.percival=true; st.morgana=true; st.excalibur=true;
    if(n>=7){ st.morgana=false; st.lancelot=true; st.lady=true; }
  }
  return st;
}
function buildRoles(n, st){
  if(n<5 || n>10) return {err:t('needPlayers', n)};
  const ev=EVIL_N[n], gd=n-ev, good=[], evil=[];
  if(st.merlin){ good.push('merlin'); evil.push('assassin'); }
  if(st.percival) good.push('percival');
  if(st.morgana) evil.push('morgana');
  if(st.mordred) evil.push('mordred');
  if(st.oberon) evil.push('oberon');
  if(st.lancelot){ good.push('lancelotGood'); evil.push('lancelotEvil'); }
  if(st.lunatic) evil.push('lunatic');
  if(st.brute) evil.push('brute');
  if(st.revealer) evil.push('revealer');
  if(st.cleric) good.push('cleric');
  if(st.trickster) evil.push('trickster');
  if(st.troublemaker) good.push('troublemaker');
  if(st.untrustworthy) good.push('untrustworthy');
  if(evil.length>ev) return {err:t('tooManyEvil', n, ev)};
  if(good.length>gd) return {err:t('tooManyGood')};
  while(evil.length<ev) evil.push('minion');
  while(good.length<gd) good.push('servant');
  return {roles:good.concat(evil), ev, gd};
}
function roleSideFor(roles, pid, allegiances){ return (allegiances && allegiances[pid]) || side(roles[pid]); }
function questChoices(role, questIndex, allegiance, settings){
  if(allegiance==='good') return ['S'];
  if(role==='lunatic') return ['F'];
  if(role==='brute' && questIndex>2) return ['S'];
  if(settings && settings.lancelotSwitch && (role==='lancelotGood' || role==='lancelotEvil')) return ['F'];
  return ['S','F'];
}
function privateRoleData(id, roles, settings, allegiances, checks=[]){
  const ids=Object.keys(roles), role=roles[id], allegiance=roleSideFor(roles,id,allegiances);
  let sees=[], see='';
  if(role==='merlin'){
    sees=ids.filter(x=>(roleSideFor(roles,x,allegiances)==='evil' && roles[x]!=='mordred') || roles[x]==='untrustworthy');
    see='see_evil';
  } else if(role==='percival'){
    sees=ids.filter(x=>roles[x]==='merlin'||roles[x]==='morgana'); see='see_mp';
  } else if(role==='untrustworthy'){
    sees=ids.filter(x=>roles[x]==='assassin'); see='see_assassin';
  } else if(settings.lancelot && !settings.lancelotSwitch && role==='lancelotGood'){
    sees=ids.filter(x=>x!==id && (roles[x]==='lancelotGood'||roles[x]==='lancelotEvil')); see='see_lancelot';
  } else if(settings.lancelot && !settings.lancelotSwitch && role==='lancelotEvil'){
    sees=ids.filter(x=>x!==id && ((roles[x]==='lancelotGood') || (roleSideFor(roles,x,allegiances)==='evil'&&roles[x]!=='oberon'))); see='see_lancelot_allies';
  } else if(allegiance==='evil' && role!=='oberon' && !(settings.lancelotSwitch && (role==='lancelotGood'||role==='lancelotEvil'))){
    sees=ids.filter(x=>x!==id && roleSideFor(roles,x,allegiances)==='evil' && roles[x]!=='oberon'); see='see_allies';
  }
  return {role, allegiance, sees, see, checks};
}
function shownLoyalty(role, allegiance){ return role==='troublemaker' ? 'evil' : allegiance; }

/* ================= Utils ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rnd(n){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]%n; }
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function randCode(len=5, A='ABCDEFGHJKMNPQRSTUVWXYZ23456789'){ let s=''; for(let i=0;i<len;i++) s+=A[rnd(A.length)]; return s; }
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem('lwav.'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('lwav.'+k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem('lwav.'+k); }catch(e){} }
};
let toastT;
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.add('hidden'), 3000); }
const AV_COLORS=['#0e7490','#1d4ed8','#0f766e','#4338ca','#0369a1','#155e75','#3730a3','#047857','#1e40af','#5b21b6','#0c4a6e','#115e59'];
function avHash(id){ let h=0; for(const c of String(id)) h=(h*31+c.charCodeAt(0))>>>0; return h; }
function avColor(id){ return AV_COLORS[avHash(id)%AV_COLORS.length]; }
function avStyle(id){ const i=avHash(id)%16, x=(i%4)*100/3, y=Math.floor(i/4)*100/3; return 'background-color:'+avColor(id)+';background-position:'+x.toFixed(3)+'% '+y.toFixed(3)+'%'; }
function initials(n){ n=String(n||'?').trim(); const ch=[...n]; return /^[A-Za-z]/.test(n) ? ch.slice(0,2).join('').toUpperCase() : (ch[0]||'?'); }

/* ================= Crypto (ECDH P-256 + AES-GCM) ================= */
const EC={name:'ECDH', namedCurve:'P-256'};
const b64=buf=>{ const u=new Uint8Array(buf); let s=''; for(let i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s); };
const unb64=s=>Uint8Array.from(atob(s), c=>c.charCodeAt(0));
async function enc(pub, obj){
  const pk=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:pub.x,y:pub.y,ext:true},EC,false,[]);
  const eph=await crypto.subtle.generateKey(EC,true,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'ECDH',public:pk},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj)));
  const e=await crypto.subtle.exportKey('jwk',eph.publicKey);
  return {e:{x:e.x,y:e.y}, iv:b64(iv), ct:b64(ct)};
}
async function dec(box){
  const pk=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:box.e.x,y:box.e.y,ext:true},EC,false,[]);
  const key=await crypto.subtle.deriveKey({name:'ECDH',public:pk},ME.priv,{name:'AES-GCM',length:256},false,['decrypt']);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv)},key,unb64(box.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
const decCache=new Map();
async function decC(box){
  const k=box.iv+box.ct.slice(0,32);
  if(decCache.has(k)) return decCache.get(k);
  const v=await dec(box); decCache.set(k,v); return v;
}

/* ================= Identity ================= */
// ME.pid is the Firebase anonymous-auth uid; the ECDH key pair lives in localStorage, bound to that uid.
const ME = {pid:null, priv:null, pub:null};
async function loadIdentity(uid){
  let id = LS.get('id');
  if(!id || id.pid!==uid || !id.priv || !id.pub){
    const kp=await crypto.subtle.generateKey(EC,true,['deriveKey']);
    const priv=await crypto.subtle.exportKey('jwk',kp.privateKey);
    const pj=await crypto.subtle.exportKey('jwk',kp.publicKey);
    id={pid:uid, priv, pub:{x:pj.x,y:pj.y}};
    LS.set('id', id);
  }
  ME.pid=id.pid; ME.pub=id.pub;
  ME.priv=await crypto.subtle.importKey('jwk',id.priv,EC,false,['deriveKey']);
}

/* ================= Network (Firebase Realtime Database) ================= */
// Layout: rooms/<CODE>/game {host, j}, seats/<uid> {j}, sec/<id> {j}, online/<uid> timestamp.
// Documents are stored as JSON strings (j) so arrays and nulls round-trip exactly.
const FIREBASE_CONFIG = (typeof window!=='undefined' && window.AVALON_FIREBASE) || {
  apiKey:'AIzaSyCfqmltcXOvlBN_GYuYhTIMEak31RpC1cg',
  authDomain:'lw-avalon.firebaseapp.com',
  databaseURL:'https://lw-avalon-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:'lw-avalon',
  storageBucket:'lw-avalon.firebasestorage.app',
  messagingSenderId:'282689238789',
  appId:'1:282689238789:web:44b4f71ad48559c88d296c'
};
// Set this before app.js to show a support button, e.g. window.AVALON_SUPPORT_URL='https://ko-fi.com/yourname'.
const SUPPORT_URL = (typeof window!=='undefined' && window.AVALON_SUPPORT_URL) || '';
const ROOM_TTL_MS = 72 * 60 * 60 * 1000;
const END_TTL_MS = 24 * 60 * 60 * 1000;
const Net = {
  db:null, auth:null, ref:null, onlineRef:null, reactionTimer:null, draftWrite:Promise.resolve(), code:null, loaded:false, conn:false, everConnected:false, authFailed:false,
  raw:new Map(), parsed:new Map(), revs:new Map(), online:new Set(),
  async init(){
    firebase.initializeApp(FIREBASE_CONFIG);
    this.auth=firebase.auth(); this.db=firebase.database();
    this.db.ref('.info/connected').on('value', s=>{
      this.conn=!!s.val();
      if(this.conn){ this.everConnected=true; this.markOnline(); }
      changed();
    });
    try{
      const cred = this.auth.currentUser ? null : await this.auth.signInAnonymously();
      const user = this.auth.currentUser || (cred && cred.user);
      if(!user) throw new Error('no user');
      return user.uid;
    }catch(e){ console.error('auth', e); this.authFailed=true; changed(); return null; }
  },
  connected(){ return this.conn; },
  join(code){
    if(this.ref){ this.ref.off(); this.ref=null; }
    clearTimeout(this.reactionTimer); this.reactionTimer=null;
    if(this.onlineRef){ this.onlineRef.onDisconnect().cancel(); this.onlineRef.remove().catch(()=>{}); this.onlineRef=null; }
    this.code=code; this.loaded=false; this.raw=new Map(); this.parsed=new Map(); this.revs=new Map(); this.online=new Set();
    if(!code) return;
    this.ref=this.db.ref('rooms/'+code);
    this.ref.on('value', snap=>this.onSnap(code, snap), err=>{ console.error('read', err); toast(t('noNet')); });
    this.markOnline();
  },
  onSnap(code, snap){
    if(code!==this.code) return;
    const v=snap.val()||{}, next=new Map();
    if(v.game && v.game.j) next.set('game', v.game.j);
    for(const [k,x] of Object.entries(v.seats||{})) if(x && x.j) next.set('seat/'+k, x.j);
    for(const [k,x] of Object.entries(v.sec||{})) if(x && x.j) next.set('sec/'+k, x.j);
    for(const key of new Set([...this.raw.keys(), ...next.keys()])){
      if(this.raw.get(key)!==next.get(key)){ this.revs.set(key, (this.revs.get(key)||0)+1); this.parsed.delete(key); }
    }
    this.raw=next;
    this.online=new Set(Object.keys(v.online||{}));
    this.loaded=true;
    clearTimeout(this.reactionTimer); this.reactionTimer=null;
    const now=Date.now(); let nextExpiry=Infinity;
    for(const x of Object.values(v.seats||{})){
      try{ const seat=x&&x.j&&JSON.parse(x.j), at=seat&&seat.reaction&&seat.reaction.at; if(at&&at+REACTION_MS>now) nextExpiry=Math.min(nextExpiry,at+REACTION_MS-now); }catch(e){}
    }
    if(Number.isFinite(nextExpiry)) this.reactionTimer=setTimeout(()=>render(), nextExpiry+80);
    changed();
  },
  get(key){
    if(!this.raw.has(key)) return null;
    if(!this.parsed.has(key)){ try{ this.parsed.set(key, JSON.parse(this.raw.get(key))); }catch(e){ this.parsed.set(key, null); } }
    return this.parsed.get(key);
  },
  ver(key){ return this.revs.get(key)||0; },
  had(key){ return this.revs.has(key); },
  pub(key, d){
    if(!this.ref) return Promise.resolve();
    const path = key==='game' ? 'game' : key.startsWith('seat/') ? 'seats/'+key.slice(5) : 'sec/'+key.slice(4);
    const val = d==null ? null : (key==='game' ? {host:d.host, j:JSON.stringify(d)} : {j:JSON.stringify(d)});
    return this.ref.child(path).set(val).catch(e=>{ console.warn('write failed', key, e); toast(t('writeFail')); });
  },
  react(pid, id, at){
    if(!this.ref) return Promise.resolve();
    return this.ref.child('seats/'+pid+'/j').transaction(raw=>{
      if(!raw) return raw;
      try{ const seat=JSON.parse(raw); seat.reaction={id,at}; return JSON.stringify(seat); }catch(e){ return; }
    }).catch(e=>{ console.warn('reaction failed', e); toast(t('writeFail')); });
  },
  draftTeam(pid, step, picks){
    if(!this.ref) return Promise.resolve();
    const code=this.code;
    this.draftWrite=this.draftWrite.catch(()=>{}).then(()=>{
      if(code!==this.code || !this.ref) return;
      return this.ref.child('seats/'+pid+'/j').transaction(raw=>{
        if(!raw) return raw;
        try{ const seat=JSON.parse(raw); seat.draftTeam={step,picks}; return JSON.stringify(seat); }catch(e){ return; }
      });
    }).catch(e=>{ console.warn('draft team failed', e); });
    return this.draftWrite;
  },
  dropRoom(){
    if(!this.ref) return Promise.resolve();
    // Delete host-owned children before the game record, because the rules use
    // the game's host id to authorize seat and secret cleanup.
    const jobs=[];
    for(const key of this.raw.keys()){
      if(key.startsWith('seat/')) jobs.push(this.ref.child('seats/'+key.slice(5)).remove());
      if(key.startsWith('sec/')) jobs.push(this.ref.child('sec/'+key.slice(4)).remove());
    }
    if(this.onlineRef) jobs.push(this.onlineRef.remove());
    return Promise.all(jobs).then(()=>this.ref.child('game').remove()).catch(e=>{ console.warn('room cleanup failed', e); toast(t('writeFail')); });
  },
  markOnline(){
    if(!this.code || !this.conn || !ME.pid) return;
    const r=this.db.ref('rooms/'+this.code+'/online/'+ME.pid);
    this.onlineRef=r;
    r.onDisconnect().remove();
    r.set(firebase.database.ServerValue.TIMESTAMP).catch(()=>{});
  },
  isOnline(pid){ return pid===ME.pid || this.online.has(pid); },
  prefixed(p){ const out={}; for(const k of this.raw.keys()){ if(k.startsWith(p)){ const d=this.get(k); if(d) out[k.slice(p.length)]=d; } } return out; }
};

/* ================= App state ================= */
const S = {
  view:'home', code:null, joinedAt:0, game:null, seats:{}, secrets:{},
  mine:null, master:null, ladyMine:[], checksMine:[], ui:{nick:'', joinCode:'', pick:[], pickStep:'', myActs:{}, busy:false, excalibur:null, rulesOpen:false, guideTab:'rules', rulesInlineOpen:false, settingsOpen:false, infoOpen:null, qrOpen:false, privacyCover:false, questConfirm:null, confirm:null, hostSuccessor:'', confirmHostTransfer:false, lastReactionAt:0, notesOpen:false},
  ov:[], seen:null, notFoundTimer:null, lastGid:null,
};

/* ================= Boot ================= */
async function boot(){
  LANG = LS.get('lang') || ((navigator.language||'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  document.documentElement.lang = LANG==='zh' ? 'zh-CN' : 'en';
  if(!window.crypto || !crypto.subtle){ $('#app').innerHTML='<div class="glass card">This browser does not support Web Crypto. Please use a recent Chrome / Safari / Edge (https).</div>'; return; }
  render();
  const uid = await Net.init();
  if(!uid){ render(); return; }
  await loadIdentity(uid);
  S.ui.nick = LS.get('nick') || '';
  const h=(location.hash||'').slice(1).toUpperCase();
  if(/^[A-Z0-9]{4,8}$/.test(h)) enterRoom(h);
  render();
  setInterval(()=>{ if(S.code) sync(); }, 4000); // refresh online dots, retry engine
}

let renderQueued=false;
function changed(){
  if(renderQueued) return; renderQueued=true;
  (window.requestAnimationFrame||setTimeout)(()=>{ renderQueued=false; sync(); });
}

/* Pull room data from Net into S, decrypt what is mine, detect transitions. */
function sync(){
  if(S.code){
    S.game = Net.get('game');
    S.seats = Net.prefixed('seat/');
    S.secrets = Net.prefixed('sec/');
    if(!S.game && Net.loaded){ toast(t('notFound', S.code)); return goHome(true); } // room missing or closed
    if(S.game && S.game.host===ME.pid && S.game.expires && Date.now()>S.game.expires){ Net.dropRoom().then(()=>goHome(true)); return; }
    if(S.game && S.game.status==='lobby' && S.autoSeat && !S.seats[ME.pid] && Net.loaded){ S.autoSeat=false; takeSeat(); }
    if(S.game && S.game.step!==S.ui.pickStep){ S.ui.pick=[]; S.ui.excalibur=null; S.ui.questConfirm=null; S.ui.pickStep=S.game.step; }
    decryptSecrets().then(()=>{ detect(); render(); hostTick(); });
  }
  render();
}
async function decryptSecrets(){
  const g=S.game, gid=g && g.gid;
  if(!gid){ S.mine=null; S.master=null; S.ladyMine=[]; S.checksMine=[]; return; }
  const m=S.secrets[ME.pid];
  if(m && m.gid===gid){ try{ S.mine=await decC(m.box); }catch(e){ S.mine=null; } } else S.mine=null;
  const ms=S.secrets.master;
  if(g.host===ME.pid && ms && ms.gid===gid){ try{ S.master=await decC(ms.box); }catch(e){ S.master=null; } } else if(g.host!==ME.pid) S.master=null;
  const lady=[], checks=(S.mine && S.mine.checks ? S.mine.checks.slice() : []);
  for(const [id,d] of Object.entries(S.secrets)){
    if(id.startsWith('lady-') && d.gid===gid && d.to===ME.pid){ try{ lady.push(await decC(d.box)); }catch(e){} }
    if(id.startsWith('check-') && d.gid===gid && d.to===ME.pid){ try{ checks.push(await decC(d.box)); }catch(e){} }
  }
  lady.sort((a,b)=>a.q-b.q); S.ladyMine=lady; S.checksMine=checks;
}
function detect(){
  const g=S.game; if(!g) return;
  const snap={gid:g.gid, rounds:(g.rounds||[]).length, quests:(g.quests||[]).filter(q=>q.r).length, end:g.status==='end', lady:S.ladyMine.length};
  const prev=S.seen; S.seen=snap;
  if(!prev || prev.gid!==snap.gid){
    S.ov=S.ov.filter(o=>o.type==='night' && g.gid);
    // New game (or first load): show the night overlay once per game.
    if(g.status==='play' && S.mine && !LS.get('night.'+g.gid)){ S.ov.push({type:'night', flipped:false}); LS.set('night.'+g.gid, 1); }
    else if(g.status==='play' && !S.mine && g.order && g.order.includes(ME.pid)) S.seen=Object.assign({}, snap, {gid:null});
    return;
  }
  if(snap.rounds>prev.rounds){ const r=g.rounds[g.rounds.length-1]; S.ov.push({type:'vote', r}); }
  if(snap.quests>prev.quests){ const qi=[...g.quests.keys()].filter(i=>g.quests[i].r)[snap.quests-1]; S.ov.push({type:'quest', qi}); }
  if(snap.lady>prev.lady){ S.ov.push({type:'lady', x:S.ladyMine[S.ladyMine.length-1]}); }
  if(snap.end && !prev.end) S.ov.push({type:'end'});
}

/* ================= Room actions ================= */
function cleanNick(){ return (S.ui.nick||'').trim().slice(0,12); }
function enterRoom(code){
  S.code=code; S.view='room'; S.joinedAt=Date.now(); S.autoSeat=true; S.seen=null;
  S.game=null; S.seats={}; S.secrets={}; S.mine=null; S.master=null; S.ladyMine=[]; S.checksMine=[]; S.ov=[];
  Net.join(code);
  setTimeout(sync, 1600);
  try{ history.replaceState(null,'','#'+code); }catch(e){ location.hash=code; }
  LS.set('last', code);
  render();
}
function goHome(forget){
  Net.join(null); S.code=null; S.view='home'; S.game=null; S.ov=[];
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  if(forget) LS.set('last', null);
  render();
}
function createRoom(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  LS.set('nick', nick);
  const code=randCode(5);
  enterRoom(code);
  S.autoSeat=false;
  Net.pub('game', {code, host:ME.pid, hostPub:ME.pub, status:'lobby', created:Date.now(), expires:Date.now()+ROOM_TTL_MS, settings:Object.assign({},DEFAULT_SETTINGS), gid:''});
  Net.pub('seat/'+ME.pid, {pid:ME.pid, nick, pub:ME.pub, joined:Date.now(), act:null});
}
function joinRoom(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  const code=(S.ui.joinCode||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{4,8}$/.test(code)) return toast(t('badCode'));
  LS.set('nick', nick); enterRoom(code);
}
function takeSeat(){
  const g=S.game; if(!g || g.status!=='lobby' || S.seats[ME.pid]) return;
  if(Object.keys(S.seats).length>=10) return toast(t('full'));
  const nick=cleanNick() || ('P'+randCode(3));
  S.ui.nick=nick; LS.set('nick', nick);
  Net.pub('seat/'+ME.pid, {pid:ME.pid, nick, pub:ME.pub, joined:Date.now(), act:null});
}
function renameSeat(){
  const nick=cleanNick(); if(!nick) return toast(t('needNick'));
  LS.set('nick', nick);
  const s=S.seats[ME.pid]; if(s && s.nick!==nick){ Net.pub('seat/'+ME.pid, Object.assign({}, s, {nick})); toast(t('renamed')); }
}
function lobbyOrder(){ return Object.values(S.seats).sort((a,b)=>(a.joined||0)-(b.joined||0) || String(a.pid).localeCompare(b.pid)).map(s=>s.pid); }
const isHost = () => !!(S.game && S.game.host===ME.pid);
function leaveRoom(){
  const g=S.game;
  if(g && g.status==='lobby'){
    const others=lobbyOrder().filter(p=>p!==ME.pid);
    if(g.host===ME.pid){
      if(others.length) Net.pub('game', Object.assign({}, g, {host:others[0], hostPub:S.seats[others[0]].pub}));
      else { Net.dropRoom(); return setTimeout(()=>goHome(true), 150); }
    }
    if(S.seats[ME.pid]) Net.pub('seat/'+ME.pid, null);
  }
  setTimeout(()=>goHome(true), 150);
}
function kick(pid){ if(isHost() && S.game.status==='lobby') Net.pub('seat/'+pid, null); }
function toggleSetting(k){
  if(!isHost() || S.game.status!=='lobby') return;
  const st=Object.assign({}, DEFAULT_SETTINGS, S.game.settings);
  st[k]=!st[k];
  if(k==='merlin' && !st.merlin){ st.percival=false; st.morgana=false; st.mordred=false; }
  if(['percival','morgana','mordred'].includes(k) && st[k]) st.merlin=true;
  if(k==='lancelotSwitch' && st.lancelotSwitch) st.lancelot=true;
  if(k==='lancelot' && !st.lancelot) st.lancelotSwitch=false;
  if(k==='untrustworthy' && st.untrustworthy) st.merlin=true;
  Net.pub('game', Object.assign({}, S.game, {settings:st}));
}
function applyPreset(id){
  if(!isHost() || S.game.status!=='lobby') return;
  const n=Math.min(10,Math.max(5,lobbyOrder().length)), st=presetSettings(id,n);
  Net.pub('game',Object.assign({},S.game,{settings:st}));
  toast(t('presetApplied',t(id==='new'?'presetNew':id==='classic'?'presetClassic':'presetBig')));
}
async function startGame(){
  const g=S.game; if(!isHost() || g.status!=='lobby' || S.ui.busy) return;
  const ids=lobbyOrder(), n=ids.length, st=Object.assign({}, DEFAULT_SETTINGS, g.settings);
  const br=buildRoles(n, st); if(br.err) return toast(br.err);
  S.ui.busy=true; render();
  try{
    const dealt=shuffle(br.roles), roles={}, allegiances={};
    ids.forEach((id,i)=>{ roles[id]=dealt[i]; allegiances[id]=side(dealt[i]); });
    const gid=randCode(8), pubs={}, nicks={}, leader=rnd(n);
    ids.forEach(id=>{ pubs[id]=S.seats[id].pub; nicks[id]=S.seats[id].nick; });
    let lancelot=null;
    if(st.lancelot && st.lancelotSwitch){
      const deck=shuffle([false,false,false,false,true,true]);
      const switched=deck.shift();
      const lp=ids.filter(id=>roles[id]==='lancelotGood'||roles[id]==='lancelotEvil');
      if(switched && lp.length===2) [allegiances[lp[0]],allegiances[lp[1]]]=[allegiances[lp[1]],allegiances[lp[0]]];
      lancelot={deck, draws:[{q:0, switched}]};
    }
    const cleric=ids.find(id=>roles[id]==='cleric'), leaderId=ids[leader];
    const needsTricksterChoice=!!(cleric && roles[leaderId]==='trickster');
    for(const id of ids){
      const checks=(id===cleric && !needsTricksterChoice) ? [{source:'cleric', target:leaderId, side:shownLoyalty(roles[leaderId],allegiances[leaderId])}] : [];
      Net.pub('sec/'+id, {gid, box: await enc(pubs[id], privateRoleData(id,roles,st,allegiances,checks))});
    }
    Net.pub('sec/master', {gid, box: await enc(ME.pub, {roles,allegiances})});
    S.master={roles,allegiances};
    const holder=(st.lady && n>=7) ? ids[(leader-1+n)%n] : null;
    Net.pub('game', {
      code:g.code, host:ME.pid, hostPub:ME.pub, created:g.created, expires:Date.now()+ROOM_TTL_MS, settings:st,
      status:'play', gid, order:ids, pubs, nicks, n,
      phase:needsTricksterChoice?'loyalty':'propose', q:0, att:1, leader, team:[], excaliburHolder:null,
      step:needsTricksterChoice?gid+':loyalty:cleric':gid+':propose:0:1',
      quests:SIZES[n].map((size,i)=>({size, two:(i===3 && n>=7), r:null, fails:null, team:null})),
      rounds:[], lady: holder ? {holder, used:[holder], log:[]} : null,
      loyalty:needsTricksterChoice?{source:'cleric', viewer:cleric, target:leaderId, next:'propose'}:null,
      lancelot, revealed:[], events:[], winner:null, reason:'', roles:null, assassinPick:null, started:Date.now()
    });
  }catch(e){ console.error(e); }
  S.ui.busy=false; render();
}
function playAgain(){
  const g=S.game; if(!isHost()) return;
  for(const id of Object.keys(S.secrets)) Net.pub('sec/'+id, null);
  Net.pub('game', {code:g.code, host:ME.pid, hostPub:ME.pub, status:'lobby', created:g.created||Date.now(), expires:Date.now()+ROOM_TTL_MS, settings:g.settings||DEFAULT_SETTINGS, gid:''});
  S.ov=[];
}
async function transferHost(){
  const g=S.game, target=S.ui.hostSuccessor;
  if(!isHost() || !g || g.status!=='play' || !S.master || S.ui.busy) return;
  if(!target || !g.order.includes(target) || target===ME.pid || !Net.isOnline(target)) return toast(t('chooseHost'));
  const seat=S.seats[target]; if(!seat||!seat.pub) return toast(t('chooseHost'));
  S.ui.busy=true; render();
  try{
    const box=await enc(seat.pub,S.master);
    const next=Object.assign({},g,{host:target,hostPub:seat.pub,events:(g.events||[]).concat([{type:'hostChanged',player:target}])});
    if(!Net.ref) throw new Error('room unavailable');
    // Keep the encrypted host key and the public host pointer in one atomic
    // database update. A dropped connection can never leave half a transfer.
    await Net.ref.update({
      'sec/master':{j:JSON.stringify({gid:g.gid,box})},
      game:{host:target,j:JSON.stringify(next)}
    });
    S.ui.confirmHostTransfer=false; toast(t('hostTransferred',nickOf(target)));
  }catch(e){ console.error(e); toast(t('writeFail')); }
  S.ui.busy=false; render();
}

/* Player action, encrypted to the host. */
async function submit(v){
  const g=S.game, seat=S.seats[ME.pid]; if(!g || !seat) return;
  const step=g.step;
  S.ui.busy=true; render();
  try{
    const box=await enc(g.hostPub, {v});
    Net.pub('seat/'+ME.pid, Object.assign({}, S.seats[ME.pid], {act:{k:step, box}}));
    S.ui.myActs[step]=v;
  }catch(e){ console.error(e); }
  S.ui.busy=false; render();
}
function acted(pid){ const s=S.seats[pid], g=S.game; return !!(s && s.act && g && s.act.k===g.step); }

/* ================= Host engine ================= */
let ticking=false, again=false;
async function hostTick(){
  const g=S.game;
  if(!g || !isHost() || g.status!=='play' || !S.master || !S.master.roles) return;
  if(ticking){ again=true; return; }
  ticking=true;
  const v0=Net.ver('game');
  try{
    const patch=await computeNext(g);
    if(patch && Net.ver('game')===v0) Net.pub('game', Object.assign({}, g, patch));
  }catch(e){ console.error('engine', e); }
  finally{ ticking=false; if(again){ again=false; hostTick(); } }
}
async function readAct(pid, step){
  const s=S.seats[pid];
  if(!s || !s.act || s.act.k!==step || !s.act.box) return undefined;
  try{ return (await decC(s.act.box)).v; }catch(e){ return undefined; }
}
function endPatch(g, winner, reason, extra){
  return Object.assign({}, extra, {status:'end', phase:'end', winner, reason, roles:S.master.roles, allegiances:S.master.allegiances, expires:Date.now()+END_TTL_MS, step:g.gid+':end'});
}
async function saveMaster(g){
  Net.pub('sec/master', {gid:g.gid, box:await enc(ME.pub,S.master)});
}
async function publishLoyalty(g, source, viewer, target, shown){
  const payload={source, target, side:shown, q:g.q};
  const key=source==='lady' ? 'lady-'+g.q : 'check-'+source+'-'+g.q;
  Net.pub('sec/'+key, {gid:g.gid, to:viewer, box:await enc(g.pubs[viewer],payload)});
}
async function beginQuest(g, base, q){
  let lancelot=g.lancelot, events=(g.events||[]).slice();
  if(g.settings.lancelotSwitch && lancelot && lancelot.deck && lancelot.deck.length){
    const deck=lancelot.deck.slice(), switched=deck.shift(), draws=(lancelot.draws||[]).concat([{q,switched}]);
    lancelot={deck,draws};
    events.push({type:switched?'lancelotSwitchLog':'lancelotNoChange',q});
    if(switched){
      const lp=g.order.filter(id=>g.roles ? (g.roles[id]==='lancelotGood'||g.roles[id]==='lancelotEvil') : (S.master.roles[id]==='lancelotGood'||S.master.roles[id]==='lancelotEvil'));
      if(lp.length===2){
        const a=Object.assign({},S.master.allegiances);
        [a[lp[0]],a[lp[1]]]=[a[lp[1]],a[lp[0]]]; S.master.allegiances=a;
        for(const id of lp) Net.pub('sec/'+id,{gid:g.gid,box:await enc(g.pubs[id],privateRoleData(id,S.master.roles,g.settings,a))});
        await saveMaster(g);
      }
    }
  }
  return Object.assign({},base,{q,phase:'propose',step:g.gid+':propose:'+q+':1',lancelot,events});
}
async function resolveQuest(g, cards, excaliburTarget){
  const roles=S.master.roles, allegiances=S.master.allegiances, finalCards=Object.assign({},cards);
  for(const u of g.team){
    if(!questChoices(roles[u],g.q,roleSideFor(roles,u,allegiances),g.settings).includes(cards[u])) return null;
  }
  if(excaliburTarget){
    if(!g.team.includes(excaliburTarget) || excaliburTarget===g.excaliburHolder) return null;
    finalCards[excaliburTarget]=finalCards[excaliburTarget]==='F'?'S':'F';
  }
  const fails=g.team.filter(u=>finalCards[u]==='F').length, qd=g.quests[g.q], failed=fails>=(qd.two?2:1);
  const quests=g.quests.map((x,i)=>i===g.q?Object.assign({},x,{r:failed?'F':'S',fails,team:g.team,excalibur:excaliburTarget||null}):x);
  const sc=quests.filter(x=>x.r==='S').length, fc=quests.filter(x=>x.r==='F').length;
  let revealed=(g.revealed||[]).slice(), events=(g.events||[]).slice();
  const revealer=g.order.find(u=>roles[u]==='revealer');
  if(fc===2 && revealer && !revealed.includes(revealer)){ revealed.push(revealer); events.push({type:'revealerShown',player:revealer,q:g.q}); }
  const common={quests,revealed,events,questBox:null,excaliburHolder:null};
  if(fc>=3) return endPatch(g,'evil','r3f',common);
  if(sc>=3){
    const vals=Object.values(roles);
    if(vals.includes('assassin')&&vals.includes('merlin')){
      if(vals.includes('untrustworthy')) return Object.assign(common,{phase:'recruit',step:g.gid+':recruit'});
      return Object.assign(common,{phase:'assassin',step:g.gid+':assassin'});
    }
    return endPatch(g,'good','r3s',common);
  }
  const q=g.q+1, base=Object.assign(common,{q,att:1,leader:(g.leader+1)%g.order.length,team:[]});
  if(g.lady && q>=2 && q<=4) return Object.assign(base,{phase:'lady',step:g.gid+':lady:'+q});
  return beginQuest(g,base,q);
}
async function computeNext(g){
  const n=g.order.length, roles=S.master.roles, gid=g.gid, inGame=u=>g.order.includes(u);
  switch(g.phase){
    case 'propose': {
      const v=await readAct(g.order[g.leader], g.step);
      const picked=Array.isArray(v)?{team:v,excalibur:null}:v;
      if(!picked || !Array.isArray(picked.team)) return null;
      const team=[...new Set(picked.team)].filter(inGame);
      if(team.length!==g.quests[g.q].size) return null;
      let excaliburHolder=null;
      if(g.settings.excalibur){
        excaliburHolder=picked.excalibur;
        if(!team.includes(excaliburHolder)||excaliburHolder===g.order[g.leader]) return null;
      }
      return {phase:'vote',team,excaliburHolder,step:gid+':vote:'+g.q+':'+g.att};
    }
    case 'vote': {
      const votes={};
      for(const u of g.order){ const v=await readAct(u, g.step); if(v===undefined) return null; votes[u]=!!v; }
      const yes=Object.values(votes).filter(Boolean).length, ok=yes*2>n;
      const rounds=(g.rounds||[]).concat([{q:g.q, att:g.att, leader:g.order[g.leader], team:g.team, votes, ok}]);
      if(ok) return {rounds, phase:'quest', step:gid+':quest:'+g.q+':'+g.att};
      if(g.att>=5) return endPatch(g, 'evil', 'r5', {rounds});
      return {rounds, att:g.att+1, leader:(g.leader+1)%n, team:[], excaliburHolder:null, phase:'propose', step:gid+':propose:'+g.q+':'+(g.att+1)};
    }
    case 'quest': {
      const cards={};
      for(const u of g.team){ const v=await readAct(u, g.step); if(v===undefined) return null; cards[u]=v; }
      for(const u of g.team){ if(!questChoices(roles[u],g.q,roleSideFor(roles,u,S.master.allegiances),g.settings).includes(cards[u])) return null; }
      if(g.settings.excalibur && g.excaliburHolder) return {phase:'excalibur',questBox:await enc(ME.pub,{cards}),step:gid+':excalibur:'+g.q+':'+g.att};
      return resolveQuest(g,cards,null);
    }
    case 'excalibur': {
      const target=await readAct(g.excaliburHolder,g.step); if(target===undefined) return null;
      const saved=await decC(g.questBox); if(!saved||!saved.cards) return null;
      return resolveQuest(g,saved.cards,target||null);
    }
    case 'lady': {
      const h=g.lady.holder, tg=await readAct(h, g.step);
      if(!inGame(tg) || tg===h || g.lady.used.includes(tg)) return null;
      if(roles[tg]==='trickster') return {phase:'loyalty',loyalty:{source:'lady',viewer:h,target:tg,next:'propose'},step:gid+':loyalty:lady:'+g.q};
      await publishLoyalty(g,'lady',h,tg,shownLoyalty(roles[tg],roleSideFor(roles,tg,S.master.allegiances)));
      const base={lady:{holder:tg,used:g.lady.used.concat([tg]),log:(g.lady.log||[]).concat([{q:g.q,from:h,to:tg}])},loyalty:null,att:1,team:[]};
      return beginQuest(g,base,g.q);
    }
    case 'loyalty': {
      const x=g.loyalty, shown=await readAct(x.target,g.step);
      if(shown!=='good'&&shown!=='evil') return null;
      await publishLoyalty(g,x.source,x.viewer,x.target,shown);
      if(x.source==='lady'){
        const base={lady:{holder:x.target,used:g.lady.used.concat([x.target]),log:(g.lady.log||[]).concat([{q:g.q,from:x.viewer,to:x.target}])},loyalty:null,att:1,team:[]};
        return beginQuest(g,base,g.q);
      }
      return {phase:'propose',loyalty:null,step:gid+':propose:'+g.q+':'+g.att};
    }
    case 'recruit': {
      const a=g.order.find(u=>roles[u]==='assassin'), tg=await readAct(a,g.step); if(!inGame(tg)||tg===a) return null;
      const servant=g.order.find(u=>roles[u]==='untrustworthy');
      if(tg===servant){
        S.master.allegiances=Object.assign({},S.master.allegiances,{[servant]:'evil'});
        Net.pub('sec/'+servant,{gid,box:await enc(g.pubs[servant],privateRoleData(servant,roles,g.settings,S.master.allegiances))});
        await saveMaster(g);
        return {phase:'assassin',recruitedPlayer:servant,recruitPick:tg,events:(g.events||[]).concat([{type:'recruited',player:servant}]),step:gid+':assassin'};
      }
      return {phase:'assassin',recruitPick:tg,step:gid+':assassin'};
    }
    case 'assassin': {
      const a=g.recruitedPlayer||g.order.find(u=>roles[u]==='assassin'); if(!a) return null;
      const tg=await readAct(a, g.step);
      if(!inGame(tg) || tg===a) return null;
      const hit=roles[tg]==='merlin';
      return endPatch(g, hit?'evil':'good', hit?'rhit':'rmiss', {assassinPick:tg});
    }
  }
  return null;
}

/* ================= Rendering ================= */
function nickOf(p){ const g=S.game; return (S.seats[p] && S.seats[p].nick) || (g && g.nicks && g.nicks[p]) || '?'; }
function avatar(p, cls){ return '<div class="'+(cls||'av')+' player-avatar" style="'+avStyle(p)+'" aria-hidden="true"></div>'; }

function render(){
  const app=$('#app'); if(!app) return;
  const gameActive=!!(S.code && S.game && S.game.status!=='lobby');
  document.body.classList.toggle('game-active', gameActive);
  document.body.classList.toggle('game-ended', gameActive && S.game.status==='end');
  const a=document.activeElement, fid=a && a.id, fsel=a && a.selectionStart;
  let html=topBar();
  if(!S.code) html+=viewHome();
  else if(!S.game) html+='<div class="glass card" style="text-align:center;max-width:480px;margin:40px auto">'+t('entering', esc(S.code))+'<div class="muted small" style="margin-top:6px">'+(Net.connected()?'':t('connecting'))+'</div></div>';
  else if(S.game.status==='lobby') html+=viewLobby();
  else html+=viewGame();
  html+=siteFooter()+privacyCoverHtml();
  app.innerHTML=html;
  renderOverlay();
  renderRulesModal();
  renderInfoModal();
  renderQRModal();
  renderConfirmModal();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus(); try{ el.setSelectionRange(fsel,fsel); }catch(e){} } }
}
function topBar(){
  const conn=Net.connected();
  const st = !Net.everConnected ? t('connecting') : (conn ? t('online') : t('offline'));
  return '<div class="top"><button class="brand" data-a="home" aria-label="'+t('home')+'"><div class="mark"><span>V</span></div><div><div class="t1">AVALON</div><div class="t2">'+t('sub')+'</div></div></button>'
    +'<div class="top-r">'+(S.code&&S.game?((S.game.status!=='lobby'?'<button class="chip btn privacy-cover-btn" data-a="privacyCover" aria-label="'+t('privacyCover')+'">◉ <span>'+t('privacyCover')+'</span></button>':'')+'<button class="chip btn rules-access" data-a="rules" aria-label="'+t('rulesAnytime')+'">📜 <span>'+t('rulesAnytime')+'</span></button><span class="chip room-chip"><span class="dot '+(conn?'on':'')+'"></span><b style="letter-spacing:2px">'+esc(S.code)+'</b></span>'):'<span class="chip"><span class="dot '+(conn?'on':'')+'"></span>'+st+'</span>')
    +'<button class="chip btn" data-a="lang">'+(LANG==='zh'?'EN':'中文')+'</button></div></div>'
    +(Net.everConnected && !conn ? '<div class="banner-off">'+t('offline')+'</div>' : '')
    +((Net.authFailed || (!Net.everConnected && S.bootAt && Date.now()-S.bootAt>15000)) ? '<div class="banner-off">'+t('noNet')+'</div>' : '');
}
function siteFooter(){
  const support = SUPPORT_URL ? '<a class="foot-link support-link" href="'+esc(SUPPORT_URL)+'" target="_blank" rel="noopener noreferrer">♡ '+t('support')+'</a>' : '';
  return '<footer class="foot"><p>'+t('footer')+'</p><nav aria-label="Footer"><button class="foot-link" data-a="info" data-info="privacy">'+t('privacy')+'</button><button class="foot-link" data-a="info" data-info="legal">'+t('legal')+'</button>'+support+'<a class="foot-link" href="https://github.com/LorraineWong/avalon" target="_blank" rel="noopener noreferrer">GitHub</a></nav></footer>';
}
function roleGuide(r, count=1){
  return '<div class="role-guide '+side(r)+'">'+roleArt(r,'guide-art')+'<span><b class="'+(side(r)==='good'?'res-s':'res-f')+'">'+rName(r)+(count>1?' ×'+count:'')+'</b><br><span class="muted">'+rDesc(r)+'</span></span></div>';
}
function currentLineupContent(){
  if(!S.game) return '';
  const actual=S.game.n || (S.game.order&&S.game.order.length) || Object.keys(S.seats||{}).length, n=Math.min(10,Math.max(5,actual));
  const built=buildRoles(n,Object.assign({},DEFAULT_SETTINGS,S.game.settings));
  if(built.err || !built.roles) return '';
  const counts={}; built.roles.forEach(r=>counts[r]=(counts[r]||0)+1);
  const roles=Object.keys(counts);
  return '<section class="current-lineup-guide"><div class="lineup-guide-head"><div><h3>♟ '+t('currentLineup')+' · '+n+'</h3><p>'+t('lineupHint')+(actual<5?' '+t('lineupPreview',n):'')+'</p></div><div class="lineup-totals"><span class="tag good">'+built.gd+' '+t('good')+'</span><span class="tag evil">'+built.ev+' '+t('evil')+'</span></div></div><div class="rgrid lineup-guide-grid">'+roles.map(r=>roleGuide(r,counts[r])).join('')+'</div></section>';
}
function rulesContent(){
  const good=['merlin','percival','cleric','troublemaker','untrustworthy','lancelotGood','servant'];
  const evil=['assassin','morgana','mordred','oberon','trickster','lunatic','brute','revealer','lancelotEvil','minion'];
  return '<section class="rules-flow"><h3>⚔ '+t('howToPlay')+'</h3><ol>'
    +[['step1Title','step1Body'],['step2Title','step2Body'],['step3Title','step3Body'],['step4Title','step4Body']].map(x=>'<li><b>'+t(x[0])+'</b><span>'+t(x[1])+'</span></li>').join('')+'</ol></section>'
    +'<div class="rules-copy"><p>'+t('rulesP3')+'</p></div><h3 class="all-role-title">'+t('allRoleGuide')+'</h3>'
    +'<div class="rule-camps"><section class="camp good"><h3>🛡️ '+t('goodCamp')+'</h3><div class="rgrid">'+good.map(r=>roleGuide(r)).join('')+'</div></section>'
    +'<section class="camp evil"><h3>🗡️ '+t('evilCamp')+'</h3><div class="rgrid">'+evil.map(r=>roleGuide(r)).join('')+'</div></section></div>'
    +'<p class="muted small rules-counts">'+t('rulesP4')+'</p>';
}
function rulesBlock(){
  return '<details class="rules" '+(S.ui.rulesInlineOpen?'open':'')+'><summary><span class="summary-mark">✦</span> '+t('rules')+'</summary>'+rulesContent()+'</details>';
}
function lobbyGuideBar(){
  const actual=Object.keys(S.seats||{}).length, n=Math.min(10,Math.max(5,actual)), built=buildRoles(n,Object.assign({},DEFAULT_SETTINGS,S.game&&S.game.settings));
  const totals=built.err?'':('<span class="tag good">'+built.gd+' '+t('good')+'</span><span class="tag evil">'+built.ev+' '+t('evil')+'</span>');
  return '<section class="glass card lobby-guide-bar"><div class="lobby-guide-copy"><span class="lobby-guide-icon">♟</span><span><b>'+t('currentLineup')+'</b><small>'+t('lobbyGuideHint')+(actual<5?' '+t('lineupPreview',n):'')+'</small></span><span class="lobby-guide-totals">'+totals+'</span></div><div class="lobby-guide-actions"><button class="btn pri" data-a="rulesLineup">♟ '+t('openLineup')+'</button><button class="btn" data-a="rulesFull">📜 '+t('fullRules')+'</button></div></section>';
}
function renderRulesModal(){
  const el=$('#rulesModal'); if(!el) return;
  if(!S.ui.rulesOpen){ if(el.innerHTML) el.innerHTML=''; el._key=null; return; }
  const tab=S.ui.guideTab==='lineup'?'lineup':'rules', key=LANG+':'+tab+':'+JSON.stringify(S.game&&S.game.settings)+':'+Object.keys(S.seats||{}).length;
  if(el._key===key && el.innerHTML) return;
  el._key=key;
  const tabs='<div class="rules-tabs" role="tablist"><button class="btn '+(tab==='lineup'?'active':'')+'" role="tab" aria-selected="'+(tab==='lineup')+'" data-a="rulesLineup">♟ '+t('currentLineup')+'</button><button class="btn '+(tab==='rules'?'active':'')+'" role="tab" aria-selected="'+(tab==='rules')+'" data-a="rulesFull">📜 '+t('fullRules')+'</button></div>';
  const content=tab==='lineup'?currentLineupContent():rulesContent();
  el.innerHTML='<div class="rules-modal" role="dialog" aria-modal="true" aria-label="'+t('rulesAnytime')+'"><div class="glass rules-sheet"><div class="rules-head"><div><div class="eyebrow">AVALON GUIDE</div><h2>'+(tab==='lineup'?'♟ '+t('currentLineup'):'📜 '+t('fullRules'))+'</h2></div><button class="btn ghost rules-close" data-a="closeRules" aria-label="'+t('close')+'">×</button></div>'+tabs+'<div class="rules-tab-content">'+content+'</div></div></div>';
  requestAnimationFrame(()=>el.querySelector('.rules-close')?.focus());
}
function infoContent(kind){
  if(LANG==='zh' && kind==='privacy') return '<p>这个网站使用 Firebase 匿名登录来连接游戏。我们会处理随机生成的匿名账号 ID、你输入的昵称、房间状态与加密后的游戏行动。你的身份解密私钥、偏好和私人推理笔记保存在当前浏览器的 localStorage。</p><p>私人笔记不会上传 Firebase，也不会分享给房主或其他玩家；但能使用这台设备和浏览器的人可能看到它们。你可以在游戏中清空本局笔记，或清除浏览器网站资料。</p><p>游戏不要求邮箱或真实姓名，也没有广告追踪器。请不要把真实姓名或敏感资料当作昵称。房间会带有有效期；房主再次连接时，过期房间会被清除，维护期间也可能删除旧房间。</p><p>Firebase 和字体服务可能按其政策处理必要的网络资料（例如 IP 地址）。如需报告隐私或安全问题，请使用 GitHub 仓库 Security 页面中的私密漏洞报告功能。</p>';
  if(LANG==='zh') return '<p>Avalon Online 是免费的非官方粉丝作品，与《抵抗组织：阿瓦隆》的设计者、发行商或权利方没有隶属、赞助或认可关系。</p><p>相关游戏名称、角色名称与设定权利归各自权利人所有。本站人物插画与网页代码为本项目原创，没有使用官方卡牌图片。请支持正版桌游。</p><p>自愿赞助（启用后）仅用于网站与开发成本，不会解锁游戏功能，也不代表出售或授权原作内容。</p>';
  if(kind==='privacy') return '<p>This site uses Firebase Anonymous Authentication to connect games. We process a randomly generated anonymous account ID, the nickname you enter, room state, and encrypted game actions. Your role-decryption private key, preferences, and private deduction notes stay in this browser’s localStorage.</p><p>Private notes are never uploaded to Firebase or shared with the host or other players. Anyone with access to this device and browser may still see them. Clear notes in the game or remove this site’s browser data when needed.</p><p>No email or real name is required, and the site has no advertising trackers. Do not use a real name or sensitive information as your nickname. Rooms carry an expiry time; an expired room is removed when its host reconnects, and old rooms may also be deleted during maintenance.</p><p>Firebase and the font provider may process necessary network data such as IP addresses under their own policies. Report privacy or security issues privately through the repository’s GitHub Security page.</p>';
  return '<p>Avalon Online is a free, unofficial fan project. It is not affiliated with, sponsored, or endorsed by the designers, publishers, or rights holders of The Resistance: Avalon.</p><p>Game, character, and setting names belong to their respective owners. The character art and site code are original to this project; no official card artwork is used. Please support the official board game.</p><p>Voluntary support, when enabled, only helps cover site and development costs. It does not unlock gameplay or sell or license any content from the original game.</p>';
}
function renderInfoModal(){
  const el=$('#infoModal'); if(!el) return;
  const kind=S.ui.infoOpen;
  if(!kind){ if(el.innerHTML) el.innerHTML=''; el._key=null; return; }
  const key=kind+':'+LANG; if(el._key===key) return; el._key=key;
  const title=kind==='privacy'?t('privacy'):t('legal');
  el.innerHTML='<div class="rules-modal info-modal" role="dialog" aria-modal="true" aria-labelledby="infoTitle"><div class="glass rules-sheet info-sheet"><div class="rules-head"><div><div class="eyebrow">AVALON ONLINE</div><h2 id="infoTitle">'+title+'</h2></div><button class="btn ghost rules-close" data-a="closeInfo" aria-label="'+t('close')+'">×</button></div><div class="info-copy">'+infoContent(kind)+'</div></div></div>';
  requestAnimationFrame(()=>el.querySelector('.rules-close')?.focus());
}
function renderQRModal(){
  const el=$('#qrModal'); if(!el) return;
  if(!S.ui.qrOpen || !S.game){ el.innerHTML=''; el._key=null; return; }
  const link=location.origin+location.pathname+'#'+S.game.code, key=LANG+':'+link;
  if(el._key===key && el.innerHTML) return; el._key=key;
  el.innerHTML='<div class="rules-modal qr-modal" role="dialog" aria-modal="true" aria-labelledby="qrTitle"><div class="glass qr-sheet"><button class="btn ghost qr-close" data-a="closeQR" aria-label="'+t('close')+'">×</button><div class="eyebrow">AVALON · '+esc(S.game.code)+'</div><h2 id="qrTitle">'+t('scanJoin')+'</h2><div id="qrCanvas" class="qr-canvas"></div><b class="qr-code">'+esc(S.game.code)+'</b><button class="btn pri" data-a="copy">🔗 '+t('copyLink')+'</button></div></div>';
  requestAnimationFrame(()=>{ const box=$('#qrCanvas'); if(box&&window.QRCode) new QRCode(box,{text:link,width:220,height:220,colorDark:'#110d0a',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M}); el.querySelector('.qr-close')?.focus(); });
}
function askConfirm(message, action, value=null, people=[], confirmLabel=''){
  S.ui.confirm={message,action,value,people,confirmLabel};
  renderConfirmModal();
}
function runConfirmed(){
  const pending=S.ui.confirm; S.ui.confirm=null; renderConfirmModal();
  if(!pending) return;
  if(pending.action==='kick') return kick(pending.value);
  if(pending.action==='leave') return leaveRoom();
  if(pending.action==='again') return playAgain();
  if(pending.action==='propose') return submit(pending.value);
  if(pending.action==='submit') return submit(pending.value);
}
function renderConfirmModal(){
  const el=$('#confirmModal'); if(!el) return;
  const pending=S.ui.confirm;
  if(!pending){ el.innerHTML=''; return; }
  const people=(pending.people||[]).map(pid=>'<span class="confirm-person"><i class="player-avatar" style="'+avStyle(pid)+'"></i><b>'+esc(nickOf(pid))+'</b></span>').join('');
  el.innerHTML='<div class="rules-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle"><div class="glass confirm-sheet '+esc(pending.action)+'"><div class="confirm-mark">!</div><h2 id="confirmTitle">'+t('confirmTitle')+'</h2><p>'+esc(pending.message)+'</p>'+(people?'<div class="confirm-people">'+people+'</div>':'')+'<div class="row"><button class="btn ghost big" data-a="confirmCancel">'+t('cancel')+'</button><button class="btn evil big" data-a="confirmRun">'+esc(pending.confirmLabel||t('confirm'))+'</button></div></div></div>';
  requestAnimationFrame(()=>el.querySelector('[data-a="confirmRun"]')?.focus());
}
function privacyCoverHtml(){
  if(!S.ui.privacyCover) return '';
  return '<div class="privacy-cover" role="dialog" aria-modal="true"><div class="privacy-cover-crest">V</div><h2>'+t('coveredTitle')+'</h2><p>'+t('coveredHint')+'</p><button class="btn pri big" data-a="privacyCover">'+t('revealScreen')+'</button></div>';
}
function viewHome(){
  const last=LS.get('last');
  return '<div class="hero"><div class="hero-art hero-art-good"><img src="'+ROLE_META.merlin.art+'" alt="Merlin"></div><div class="hero-art hero-art-evil"><img src="'+ROLE_META.morgana.art+'" alt="Morgana"></div>'
    +'<div class="hero-copy"><div class="eyebrow">THE RESISTANCE</div><div class="crest"><span>V</span></div><h1>AVALON</h1><div class="sub">'+t('tagline')+'</div><p class="hero-oath">'+(LANG==='zh'?'忠诚藏于誓言，背叛隐于圆桌。':'Loyalty hides in every oath. Treachery sits at the table.')+'</p>'
    +'<div class="feature"><span>♟ '+t('feat1')+'</span><span>✦ '+t('feat2')+'</span><span>⌁ '+t('feat3')+'</span><span>⌘ '+t('feat4')+'</span></div></div></div>'
    +(last ? '<div class="glass resume"><span>'+t('resume','<b style="letter-spacing:2px">'+esc(last)+'</b>')+'</span><button class="btn pri" data-a="resume">'+t('resumeBtn')+'</button></div>' : '')
    +'<div class="home-grid"><div class="glass card"><h2>'+t('nick')+'</h2><input class="input" id="nick" aria-label="'+t('nick')+'" maxlength="12" placeholder="'+t('nickPh')+'" value="'+esc(S.ui.nick)+'">'
    +'<button class="btn pri big" style="width:100%;margin-top:14px" data-a="create">✨ '+t('create')+'</button></div>'
    +'<div class="glass card"><h2>'+t('joinTitle')+'</h2><div class="row"><input class="input code" id="joinCode" aria-label="'+t('codePh')+'" maxlength="8" placeholder="'+t('codePh')+'" value="'+esc(S.ui.joinCode)+'" style="flex:1;min-width:0">'
    +'<button class="btn" data-a="join">'+t('join')+'</button></div><p class="muted small" style="margin-bottom:0">'+t('joinHint')+'</p></div></div>'
    +'<div class="glass card" style="max-width:820px;margin:16px auto 0">'+rulesBlock()+'</div>';
}
function viewLobby(){
  const g=S.game, ids=lobbyOrder(), n=ids.length, host=isHost(), seated=!!S.seats[ME.pid];
  const st=Object.assign({}, DEFAULT_SETTINGS, g.settings);
  const br=buildRoles(n, st), pv=buildRoles(Math.min(10,Math.max(5,n)), st);
  let seats=ids.map(p=>{
    const s=S.seats[p];
    return '<div class="seatcard">'+'<div class="av player-avatar" style="'+avStyle(p)+'"><span class="on '+(Net.isOnline(p)?'y':'')+'"></span></div>'
      +'<div><div class="nm">'+esc(s.nick)+'</div>'+(p===g.host?'<span class="tag host">👑 '+t('host')+'</span>':'')+(p===ME.pid?'<span class="tag me">'+t('you')+'</span>':'')+'</div>'
      +(host && p!==ME.pid ? '<button class="x" title="kick" data-kick="'+esc(p)+'">×</button>' : '')+'</div>';
  }).join('');
  for(let i=n;i<Math.max(5,Math.min(10,n+1));i++) seats+='<div class="seatcard empty tiny">'+t('emptySeat')+'</div>';
  const tile=(k,role,name,desc,cls)=>'<button class="rt '+cls+(st[k]?' on':'')+'" '+(host?'data-set="'+k+'"':'disabled')+'>'+roleArt(role,'tile-art')+'<span><b>'+name+'</b><span>'+desc+'</span></span></button>';
  const lineupSide=(s,label,count)=>'<section class="lineup-side '+s+'"><h3><span>'+(s==='good'?'🛡️':'🗡️')+' '+label+'</span><b>'+count+'</b></h3><div class="lineup-roles">'+pv.roles.filter(r=>side(r)===s).map(r=>'<span class="tag '+s+'">'+ROLE_META[r].ic+' '+rName(r)+'</span>').join('')+'</div></section>';
  const compHtml = pv.err ? '<p class="warn small">'+esc(pv.err)+'</p>' :
    '<div class="lineup-title">'+t('currentLineup')+' · '+Math.min(10,Math.max(5,n))+'</div><div class="lineup">'+lineupSide('good',t('goodCamp'),pv.gd)+lineupSide('evil',t('evilCamp'),pv.ev)+'</div>'
    +'<p class="muted small" style="margin:7px 0 0">'+(n>=5&&n<=10 ? t('comp', n, pv.gd, pv.ev) : t('compPrev', Math.min(10,Math.max(5,n)), pv.gd, pv.ev))+'</p>';
  const goodSettings=tile('percival','percival',rName('percival'),rDesc('percival').split(/[。.]/)[0],'good')
    +tile('cleric','cleric',rName('cleric'),rDesc('cleric').split(/[。.]/)[0],'good')
    +tile('troublemaker','troublemaker',rName('troublemaker'),rDesc('troublemaker').split(/[。.]/)[0],'good')
    +tile('untrustworthy','untrustworthy',rName('untrustworthy'),rDesc('untrustworthy').split(/[。.]/)[0],'good');
  const evilSettings=tile('morgana','morgana',rName('morgana'),rDesc('morgana').split(/[。.]/)[0],'evil')
    +tile('mordred','mordred',rName('mordred'),rDesc('mordred').split(/[。.]/)[0],'evil')
    +tile('oberon','oberon',rName('oberon'),rDesc('oberon').split(/[，(（,]/)[0],'evil')
    +tile('lunatic','lunatic',rName('lunatic'),rDesc('lunatic').split(/[。.]/)[0],'evil')
    +tile('brute','brute',rName('brute'),rDesc('brute').split(/[。.]/)[0],'evil')
    +tile('revealer','revealer',rName('revealer'),rDesc('revealer').split(/[。.]/)[0],'evil')
    +tile('trickster','trickster',rName('trickster'),rDesc('trickster').split(/[。.]/)[0],'evil');
  const modules=tile('merlin','merlin',t('optMerlin'),t('optMerlinD'),'neutral')
    +tile('lancelot','lancelotGood',t('optLancelot'),t('optLancelotD'),'neutral')
    +tile('lancelotSwitch','lancelotEvil',t('optLancelotSwitch'),t('optLancelotSwitchD'),'neutral')
    +'<button class="rt neutral'+(st.lady?' on':'')+'" '+(host?'data-set="lady"':'disabled')+'><span class="lady-art">◯</span><span><b>'+t('optLady')+'</b><span>'+t('optLadyD')+'</span></span></button>'
    +'<button class="rt neutral'+(st.excalibur?' on':'')+'" '+(host?'data-set="excalibur"':'disabled')+'><span class="lady-art">⚔</span><span><b>'+t('optExcalibur')+'</b><span>'+t('optExcaliburD')+'</span></span></button>';
  return '<div class="glass card roomcode"><div><div class="muted small">'+t('roomCode')+'</div><div class="code">'+esc(g.code)+'</div><div class="muted small">'+t('inviteHint')+'</div></div>'
    +'<div class="row"><button class="btn pri" data-a="copy">🔗 '+t('copyLink')+'</button><button class="btn" data-a="qr">▦ '+t('showQR')+'</button>'+(navigator.share?'<button class="btn" data-a="share">'+t('share')+'</button>':'')+'</div></div>'
    +lobbyGuideBar()+'<div class="lobby"><div class="glass card"><h2>'+t('players')+' · '+n+'/10</h2><div class="seats">'+seats+'</div>'
    +'<div class="row" style="margin-top:14px"><input class="input" id="nick" maxlength="12" placeholder="'+t('nickPh')+'" value="'+esc(S.ui.nick)+'" style="flex:1;min-width:120px">'
    +(seated?'<button class="btn" data-a="rename">'+t('rename')+'</button>':'<button class="btn pri" data-a="seat">'+t('seat')+'</button>')+'</div>'
    +'<div class="row" style="margin-top:14px">'
    +(host?'<button class="btn pri big" data-a="start" '+(br.err||S.ui.busy?'disabled':'')+'>'+(S.ui.busy?t('dealing'):'⚔️ '+t('start'))+'</button>':'<span class="muted" style="flex:1">⏳ '+t('waitHost')+'</span>')
    +'<button class="btn ghost" data-a="leave">'+t('leave')+'</button></div>'
    +(host&&br.err?'<p class="warn small" style="margin-bottom:0">'+esc(br.err)+'</p>':'')+'</div>'
    +'<div class="glass card"><h2>'+t('roleSettings')+(host?'':' <span class="muted small">· '+t('hostOnly')+'</span>')+'</h2><div class="preset-wrap"><span class="muted tiny">'+t('presets')+'</span><div class="preset-row"><button class="btn preset-btn" data-preset="new" '+(host?'':'disabled')+'>🛡 '+t('presetNew')+'</button><button class="btn preset-btn" data-preset="classic" '+(host?'':'disabled')+'>⚔ '+t('presetClassic')+'</button><button class="btn preset-btn" data-preset="big" '+(host?'':'disabled')+'>✦ '+t('presetBig')+'</button></div></div>'+compHtml
    +'<details class="settings-advanced" '+(S.ui.settingsOpen?'open':'')+'><summary><span><b>⚙ '+t('advancedRoles')+'</b><small>'+t('advancedRolesHint')+'</small></span><i>⌄</i></summary><div class="settings-advanced-body"><div class="settings-camps">'
    +'<section class="setting-camp good"><h3>🛡️ '+t('goodCamp')+'</h3><div class="roletiles">'+goodSettings+'</div></section>'
    +'<section class="setting-camp evil"><h3>🗡️ '+t('evilCamp')+'</h3><div class="roletiles">'+evilSettings+'</div></section></div>'
    +'<section class="setting-camp modules"><h3>✦ '+t('gameModules')+'</h3><div class="roletiles">'+modules+'</div></section></div></details></div></div>';
}

function pickMode(g){
  if(S.ui.busy || g.status!=='play') return null;
  const me=ME.pid;
  if(g.phase==='propose' && g.order[g.leader]===me) return {max:g.quests[g.q].size, ok:()=>true};
  if(g.phase==='lady' && g.lady && g.lady.holder===me) return {max:1, ok:u=>u!==me && !g.lady.used.includes(u)};
  if(g.phase==='excalibur' && g.excaliburHolder===me) return {max:1, ok:u=>g.team.includes(u)&&u!==me};
  if(g.phase==='recruit' && S.mine && S.mine.role==='assassin') return {max:1, ok:u=>u!==me};
  if(g.phase==='assassin' && ((g.recruitedPlayer&&g.recruitedPlayer===me)||(!g.recruitedPlayer&&S.mine&&S.mine.role==='assassin'))) return {max:1, ok:u=>u!==me};
  return null;
}
function needsAct(g,u){
  if(g.phase==='propose') return g.order[g.leader]===u;
  if(g.phase==='vote') return true;
  if(g.phase==='quest') return (g.team||[]).includes(u);
  if(g.phase==='excalibur') return g.excaliburHolder===u;
  if(g.phase==='lady') return !!(g.lady && g.lady.holder===u);
  if(g.phase==='loyalty') return !!(g.loyalty && g.loyalty.target===u);
  if(g.phase==='recruit') return u===ME.pid&&S.mine&&S.mine.role==='assassin';
  if(g.phase==='assassin') return u===ME.pid&&((g.recruitedPlayer&&g.recruitedPlayer===u)||(!g.recruitedPlayer&&S.mine&&S.mine.role==='assassin'));
  return false;
}
function viewGame(){
  const g=S.game, n=g.order.length;
  const offline = g.status==='play' && !isHost() && Net.connected() && Date.now()-S.joinedAt>25000 && !Net.isOnline(g.host);
  return (offline?'<div class="banner-off">⚠️ '+t('hostOffline', esc(nickOf(g.host)))+'</div>':'')
    +'<div class="game"><div>'+tableView(g)+'</div><div class="panel">'
    +'<div class="dock '+(g.status==='end'?'dock-end':'')+'">'+actionBlock(g)+'</div>'
    +roleBar()+hostToolsPanel(g)+privateNotesPanel(g)+reactionPanel(g)+historyBlock(g)
    +'<div class="glass card">'+rulesBlock()+'</div></div></div>';
}
function notesStorageKey(g=S.game){ return g&&S.code ? 'notes.'+S.code+'.'+(g.gid||'lobby') : ''; }
function readPrivateNotes(){ const key=notesStorageKey(); return key ? (LS.get(key)||{}) : {}; }
function noteRoleOptions(g){
  const built=buildRoles(g.n||g.order.length,Object.assign({},DEFAULT_SETTINGS,g.settings));
  return built.roles ? [...new Set(built.roles)] : [];
}
function noteMarkLabel(mark){
  if(mark==='good') return t('leanGood');
  if(mark==='evil') return t('leanEvil');
  return ROLE_META[mark] ? rName(mark) : '';
}
function savePrivateNote(pid, field, value){
  const g=S.game, key=notesStorageKey(g); if(!g||!key||!g.order.includes(pid)) return;
  const notes=readPrivateNotes(), next=Object.assign({},notes[pid]||{});
  if(field==='text') next.text=String(value||'').slice(0,240);
  if(field==='mark'){
    const allowed=new Set(['','good','evil',...noteRoleOptions(g)]); if(!allowed.has(value)) return;
    next.mark=value;
  }
  if(!next.text&&!next.mark) delete notes[pid]; else notes[pid]=next;
  LS.set(key,notes);
}
function privateNotesPanel(g){
  if(!g.order||!g.order.length) return '';
  const open=S.ui.notesOpen;
  if(!open) return '<button class="glass card private-notes-toggle" data-a="toggleNotes"><span>✎</span><span><b>'+t('privateNotes')+'</b><small>'+t('openNotes')+'</small></span><span>›</span></button>';
  const notes=readPrivateNotes(), roles=noteRoleOptions(g);
  const options=(selected)=>'<option value="">'+t('unmarked')+'</option><option value="good" '+(selected==='good'?'selected':'')+'>🛡 '+t('leanGood')+'</option><option value="evil" '+(selected==='evil'?'selected':'')+'>🗡 '+t('leanEvil')+'</option>'+roles.map(r=>'<option value="'+r+'" '+(selected===r?'selected':'')+'>'+ROLE_META[r].ic+' '+rName(r)+'</option>').join('');
  const rows=g.order.filter(pid=>pid!==ME.pid).map(pid=>{ const note=notes[pid]||{}; return '<div class="private-note-row"><div class="private-note-person"><span class="note-avatar player-avatar" style="'+avStyle(pid)+'"></span><b>'+esc(nickOf(pid))+'</b></div><select class="note-select" data-note-player="'+esc(pid)+'" aria-label="'+t('suspectAs')+' · '+esc(nickOf(pid))+'">'+options(note.mark||'')+'</select><textarea class="note-text" data-note-player="'+esc(pid)+'" maxlength="240" rows="2" aria-label="'+t('privateNotes')+' · '+esc(nickOf(pid))+'" placeholder="'+t('notePlaceholder')+'">'+esc(note.text||'')+'</textarea></div>'; }).join('');
  return '<section class="glass card private-notes"><div class="private-notes-head"><div><h3>✎ '+t('privateNotes')+'</h3><p>🔒 '+t('notesHint')+'</p></div><button class="btn ghost notes-collapse" data-a="toggleNotes">'+t('closeNotes')+'</button></div><div class="private-note-list">'+rows+'</div><button class="btn link notes-clear" data-a="clearNotes">'+t('clearNotes')+'</button></section>';
}
function reactionPanel(g){
  if(!g.order.includes(ME.pid) || !S.seats[ME.pid]) return '';
  return '<div class="glass card reactions"><div class="reaction-head"><h3>'+t('react')+'</h3><span class="muted tiny">'+t('reactHint')+'</span></div><div class="reaction-row">'
    +REACTIONS.map(r=>'<button class="reaction-btn" data-reaction="'+r.id+'" aria-label="'+t(r.label)+'" title="'+t(r.label)+'">'+r.emoji+'</button>').join('')+'</div></div>';
}
function sendReaction(id){
  const def=REACTIONS.find(r=>r.id===id), now=Date.now();
  if(!def || !S.seats[ME.pid] || now-S.ui.lastReactionAt<700) return;
  S.ui.lastReactionAt=now;
  Net.react(ME.pid,id,now);
}
function visibleReaction(seat){
  const r=seat&&seat.reaction, def=r&&REACTIONS.find(x=>x.id===r.id);
  return def && Date.now()-r.at<REACTION_MS ? def : null;
}
function publicDraftTeam(g){
  if(!g || g.phase!=='propose') return [];
  const leader=g.order[g.leader], max=g.quests[g.q].size;
  if(leader===ME.pid) return S.ui.pick.slice(0,max);
  const draft=S.seats[leader]&&S.seats[leader].draftTeam;
  if(!draft || draft.step!==g.step || !Array.isArray(draft.picks)) return [];
  return [...new Set(draft.picks)].filter(pid=>g.order.includes(pid)).slice(0,max);
}
function questScore(g){
  return (g.quests||[]).reduce((out,q)=>{ if(q.r==='S') out.good++; if(q.r==='F') out.evil++; return out; },{good:0,evil:0});
}
function phaseActors(g){
  if(!g||g.status!=='play') return [];
  if(g.phase==='propose') return [g.order[g.leader]];
  if(g.phase==='vote') return g.order.slice();
  if(g.phase==='quest') return (g.team||[]).slice();
  if(g.phase==='excalibur') return g.excaliburHolder?[g.excaliburHolder]:[];
  if(g.phase==='lady') return g.lady&&g.lady.holder?[g.lady.holder]:[];
  if(g.phase==='loyalty') return g.loyalty&&g.loyalty.target?[g.loyalty.target]:[];
  // Recruitment and assassination actors are deliberately not exposed here.
  return [];
}
function actionStatus(g){
  const actors=phaseActors(g); if(!actors.length) return '';
  const waiting=actors.filter(pid=>!acted(pid));
  if(!waiting.length) return '<div class="action-status done">✓ '+t('allDone')+'</div>';
  return '<div class="action-status"><b>'+t('waitingFor')+'</b><div class="wait-people">'+waiting.map(pid=>'<span class="wait-person '+(Net.isOnline(pid)?'':'offline')+'"><i class="player-avatar" style="'+avStyle(pid)+'"></i><span>'+esc(nickOf(pid))+(Net.isOnline(pid)?'':' · '+t('offlinePlayer'))+'</span></span>').join('')+'</div></div>';
}
function tableView(g){
  const n=g.order.length, pm=pickMode(g), endRoles=g.status==='end'?(g.roles||{}):null;
  const privateNotes=S.ui.notesOpen?readPrivateNotes():{};
  const sees=new Set((S.peek&&S.mine&&S.mine.sees)||[]), lady={}; if(S.peek) S.ladyMine.forEach(x=>lady[x.target]=x.side); // private info only while the role card is open
  const checked={}; if(S.peek) S.checksMine.filter(x=>x.source!=='lady').forEach(x=>checked[x.target]=x.side);
  const draftTeam=publicDraftTeam(g);
  const last=(g.rounds||[]).slice(-1)[0];
  const showVotes = last && g.status==='play' && (g.phase==='quest' || (g.phase==='propose' && !last.ok && last.q===g.q));
  const L=g.order[g.leader];
  const seats=g.order.map((p,i)=>{
    const ang=(-90 + i*360/n)*Math.PI/180, R=41;
    const x=50+R*Math.cos(ang), y=50+R*Math.sin(ang);
    const onTeam=['vote','quest','excalibur'].includes(g.phase) && (g.team||[]).includes(p);
    const can=pm && pm.ok(p), picked=(g.phase==='propose'?draftTeam:S.ui.pick).includes(p), skillKnown=sees.has(p)||!!lady[p]||!!checked[p];
    let tags='';
    if(endRoles && endRoles[p]) tags+='<span class="tag '+((g.allegiances&&g.allegiances[p])||side(endRoles[p]))+'">'+ROLE_META[endRoles[p]].ic+' '+rName(endRoles[p])+'</span>';
    else {
      if(sees.has(p)) tags+='<span class="tag clue">'+t(S.mine.see)+'</span>';
      if(lady[p]) tags+='<span class="tag '+lady[p]+'">🧜‍♀️ '+t(lady[p])+'</span>';
      if((g.revealed||[]).includes(p)) tags+='<span class="tag evil">◉ '+rName('revealer')+'</span>';
      const note=privateNotes[p], noteLabel=note&&noteMarkLabel(note.mark);
      if(noteLabel) tags+='<span class="tag note-tag '+(note.mark==='good'||side(note.mark)==='good'?'good':note.mark==='evil'||side(note.mark)==='evil'?'evil':'')+'">✎ '+esc(noteLabel)+'</span>';
    }
    let badges='<span class="b-off '+(Net.isOnline(p)?'y':'')+'"></span>';
    const reaction=visibleReaction(S.seats[p]);
    if(reaction) badges+='<span class="reaction-bubble" aria-label="'+t(reaction.label)+'">'+reaction.emoji+'</span>';
    if(skillKnown) badges+='<span class="badge b-known" aria-label="'+t('youSee',nickOf(p))+'">👁</span>';
    if(picked) badges+='<span class="badge b-pick-order" aria-label="'+t('selectedTeam')+'">'+((g.phase==='propose'?draftTeam:S.ui.pick).indexOf(p)+1)+'</span>';
    if(g.status==='play' && p===L && ['propose','vote','quest','excalibur'].includes(g.phase)) badges+='<span class="badge b-crown">👑</span>';
    if(g.lady && g.lady.holder===p && g.status==='play') badges+='<span class="badge b-lady">🧜‍♀️</span>';
    if(g.excaliburHolder===p && g.status==='play') badges+='<span class="badge b-lady">⚔</span>';
    if(g.status==='play' && needsAct(g,p)) badges+= acted(p) ? '<span class="badge b-act">✓</span>' : '<span class="badge b-wait">⏳</span>';
    if(showVotes && last.votes[p]!==undefined) badges+='<span class="badge b-vote '+(last.votes[p]?'y':'n')+'">'+(last.votes[p]?'✓':'✗')+'</span>';
    const cls='seatp'+(onTeam?' team':'')+(can?' pick':'')+(picked?' picked':'')+(skillKnown?' skill-known':'')+(p===ME.pid?' me':'')+(g.assassinPick===p?' stabbed':'')+(pm&&!can?' dimmed':'');
    return '<button class="'+cls+'" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%" '+(can?'data-pick="'+esc(p)+'"':'tabindex="-1"')+'>'
      +'<div class="pav player-avatar" style="'+avStyle(p)+'">'+badges+'</div>'
      +'<div class="pn">'+(i+1)+'·'+esc(nickOf(p))+'</div><div class="pt">'+tags+'</div></button>';
  }).join('');
  const qt=g.quests.map((q,i)=>'<div class="qt '+(q.r||'')+(q.two?' two':'')+(i===g.q&&g.status==='play'&&!q.r?' cur':'')+'">'+(q.r?(q.r==='S'?'✓':'✗'):q.size)
    +'<small>'+(q.r?t('fails',q.fails):t('questN',i+1))+'</small></div>').join('');
  const rej=[1,2,3,4,5].map(i=>'<i class="'+(i<g.att&&g.status==='play'?'x':'')+(i===5?' last':'')+'"></i>').join('');
  const score=questScore(g), scoreLabel=t('good')+' '+score.good+' · '+t('evil')+' '+score.evil, scoreHint=score.good>=3?t('r3s'):score.evil>=3?t('r3f'):t('goodNeeds',3-score.good)+' · '+t('evilNeeds',3-score.evil); let center;
  if(g.status==='end') center='<div class="table-kicker">'+t('score')+'</div><div class="ph" style="color:'+(g.winner==='good'?'#7dd3fc':'#ff756a')+'">'+(g.winner==='good'?'🛡️ '+t('goodWin'):'🗡️ '+t('evilWin'))+'</div><div class="scoreline" aria-label="'+esc(scoreLabel)+'"><span class="score-good">🛡 '+score.good+'</span><i>:</i><span class="score-evil">'+score.evil+' 🗡</span></div><div class="phs">'+t(g.reason)+'</div>';
  else center='<div class="table-kicker">'+t('questN', g.q+1)+' · '+t('attempt',g.att)+'</div><div class="ph">'+t('ph_'+g.phase)+'</div><div class="scoreline" aria-label="'+esc(scoreLabel)+'"><span class="score-good">🛡 '+score.good+'</span><i>:</i><span class="score-evil">'+score.evil+' 🗡</span></div><div class="phs">'+scoreHint+'</div>';
  return '<div class="glass card" style="padding:10px"><div class="tablewrap"><div class="table"><div class="disc">'+center+'<div class="qtoks">'+qt+'</div>'
    +(g.status==='play'?'<div class="rejs">'+rej+'<span>'+t('attempt', g.att)+'</span></div>':'')+'</div>'+seats+'</div></div>'
    +(g.lady&&g.lady.log&&g.lady.log.length?'<p class="muted small" style="text-align:center;margin:4px 0 6px">🧜‍♀️ '+g.lady.log.map(x=>esc(nickOf(x.from))+' → '+esc(nickOf(x.to))).join(' · ')+'</p>':'')
    +(g.events&&g.events.length?'<p class="muted small" style="text-align:center;margin:4px 0 6px">'+g.events.slice(-3).map(x=>'✦ '+t(x.type)+(x.player?' · '+esc(nickOf(x.player)):'')).join(' · ')+'</p>':'')+'</div>';
}
function assassinationResult(g, compact=false){
  const target=g&&g.assassinPick, roles=g&&g.roles;
  if(!target || !roles || !roles[target]) return '';
  const role=roles[target], hit=role==='merlin';
  return '<section class="assassination-result '+(hit?'hit':'miss')+(compact?' compact':'')+'"><div class="assassination-mark">'+(hit?'✓':'✕')+'</div><div class="assassination-copy"><small>'+t('assResult')+'</small><strong>'+(hit?t('assHit'):t('assMiss'))+'</strong><div class="assassination-target"><span class="assassination-avatar player-avatar" style="'+avStyle(target)+'"></span><span><b>'+esc(nickOf(target))+'</b><em>'+t('revealedAs',esc(nickOf(target)),'<b>'+ROLE_META[role].ic+' '+rName(role)+'</b>')+'</em></span></div></div></section>';
}
function selectedTeamReview(list,size){
  return '<section class="selected-team-review"><div class="selected-team-head"><b>'+t('selectedTeam')+' · '+list.length+'/'+size+'</b>'+(list.length?'<small>'+t('tapRemove')+'</small>':'')+'</div><div class="selected-people">'+list.map((pid,i)=>'<button class="selected-person" data-pick="'+esc(pid)+'" aria-label="'+t('tapRemove')+' · '+esc(nickOf(pid))+'"><span class="selected-order">'+(i+1)+'</span><i class="player-avatar" style="'+avStyle(pid)+'"></i><span>'+esc(nickOf(pid))+'</span><em>×</em></button>').join('')+'</div></section>';
}
function actionBlock(g){
  const me=ME.pid, inGame=g.order.includes(me), busy=S.ui.busy, mine=S.ui.myActs[g.step], L=g.order[g.leader];
  if(g.status==='end') return '<div class="glass card act">'+assassinationResult(g,true)+'<h2>'+(g.winner==='good'?'🛡️ '+t('goodWin'):'🗡️ '+t('evilWin'))+'</h2><div class="hint">'+t(g.reason)+'</div>'
    +'<div class="row">'+(isHost()?'<button class="btn pri big" data-a="again">🔄 '+t('again')+'</button>':'<span class="muted">'+t('waitAgain')+'</span>')+'<button class="btn ghost" data-a="showend">'+t('allRoles')+'</button></div></div>';
  if(!inGame) return '<div class="glass card act"><h2>👀 '+t('spectator')+'</h2><div class="hint">'+t('ph_'+g.phase)+'</div></div>';
  const prog=(list)=>{ const k=list.filter(acted).length; return '<div class="progress"><b style="width:'+(100*k/list.length)+'%"></b></div>'; };
  const chips=list=>'<div class="pickrow">'+list.map(u=>'<span class="tag" style="font-size:13px;padding:2px 10px">'+esc(nickOf(u))+'</span>').join('')+'</div>';
  let h='';
  if(g.phase==='propose'){
    const size=g.quests[g.q].size;
    if(L===me){
      const sword=g.settings.excalibur && S.ui.pick.length===size ? '<div class="hint" style="margin-top:10px">⚔ '+t('excaliburPick')+'<br><span class="muted small">'+t('excaliburHint')+'</span></div><div class="pickrow">'+S.ui.pick.filter(u=>u!==me).map(u=>'<button class="tag '+(S.ui.excalibur===u?'good':'')+'" data-excalibur="'+esc(u)+'">⚔ '+esc(nickOf(u))+'</button>').join('')+'</div>' : '';
      const ready=S.ui.pick.length===size && (!g.settings.excalibur||!!S.ui.excalibur);
      h='<h2>👑 '+t('leaderPick', size)+'</h2><div class="hint">'+t('leaderHint')+'</div>'+selectedTeamReview(S.ui.pick,size)+sword
        +'<button class="btn pri big" style="width:100%" data-a="propose" '+(!ready||busy?'disabled':'')+'>'+(acted(me)?t('resubmit'):t('submitTeam'))+'</button>';
    }
    else { const draft=publicDraftTeam(g); h='<h2>⏳ '+t('waitLeader', esc(nickOf(L)), size)+'</h2><div class="hint">'+t('discuss')+'</div>'+(draft.length?'<div class="muted tiny" style="margin-bottom:5px">'+t('leaderDraft')+' · '+draft.length+'/'+size+'</div>'+chips(draft):''); }
  } else if(g.phase==='vote'){
    h='<h2>🗳️ '+t('voteTitle')+'</h2>'+chips(g.team)
      +'<div class="row"><button class="btn good big '+(mine===true?'sel':'')+'" data-vote="1" '+(busy?'disabled':'')+'>👍 '+t('approve')+'</button>'
      +'<button class="btn evil big '+(mine===false?'sel':'')+'" data-vote="0" '+(busy?'disabled':'')+'>👎 '+t('reject')+'</button></div>'
      +'<div class="hint" style="margin:10px 0 0">'+(acted(me)?t('voted'):t('pleaseVote'))+' · '+t('votedCount', g.order.filter(acted).length, g.order.length)+'</div>'+prog(g.order);
  } else if(g.phase==='quest'){
    h='<h2>⚔️ '+t('questTitle')+'</h2>'+chips(g.team);
    if(g.team.includes(me)){
      const allegiance=(S.mine&&S.mine.allegiance)||side(S.mine&&S.mine.role), choices=S.mine?questChoices(S.mine.role,g.q,allegiance,g.settings):['S'];
      const note=choices.length===1?(choices[0]==='F'?t('mustFail'):t(allegiance==='evil'?'cannotFail':'goodOnly')):t('evilChoice');
      if(S.ui.questConfirm){
        const qv=S.ui.questConfirm;
        h+='<div class="quest-confirm '+(qv==='S'?'success':'fail')+'"><div><small>'+t('confirmQuest')+'</small><strong>'+(qv==='S'?'✓ '+t('success'):'✗ '+t('fail'))+'</strong><p>'+t('confirmQuestHint')+'</p></div><button class="btn '+(qv==='S'?'good':'evil')+' big" data-a="questSubmit" '+(busy?'disabled':'')+'>'+(qv==='S'?t('confirmSuccess'):t('confirmFail'))+'</button><button class="btn ghost" data-a="questCancel">'+t('changeChoice')+'</button></div>';
      } else {
        h+='<div class="row"><button class="btn good big '+(mine==='S'?'sel':'')+'" data-quest="S" '+(!choices.includes('S')||busy?'disabled':'')+'>✓ '+t('success')+'</button>'
          +'<button class="btn evil big '+(mine==='F'?'sel':'')+'" data-quest="F" '+(!choices.includes('F')||busy?'disabled':'')+'>✗ '+t('fail')+'</button></div>';
      }
      h+='<div class="hint" style="margin:10px 0 0">'+note+(acted(me)?' '+t('youPlayed'):'')+(g.quests[g.q].two?' '+t('twoNote'):'')+'</div>';
    } else h+='<div class="hint">'+t('waitTeam')+' '+t('played', g.team.filter(acted).length, g.team.length)+(g.quests[g.q].two?' · '+t('twoNote'):'')+'</div>';
    h+=prog(g.team);
  } else if(g.phase==='excalibur'){
    if(g.excaliburHolder===me) h='<h2>⚔ '+t('excaliburUse')+'</h2>'+chips(g.team.filter(u=>u!==me))+'<button class="btn pri big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>⚔ '+(S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button><button class="btn ghost" style="width:100%;margin-top:8px" data-a="excaliburSkip" '+(busy?'disabled':'')+'>'+t('excaliburSkip')+'</button>';
    else h='<h2>⚔ '+t('ph_excalibur')+'</h2><div class="hint">'+t('excaliburWait',esc(nickOf(g.excaliburHolder)))+'</div>';
  } else if(g.phase==='lady'){
    const ho=g.lady.holder;
    if(ho===me) h='<h2>🧜‍♀️ '+t('ladyTitle')+'</h2><div class="hint">'+t('ladyHint')+'</div><button class="btn pri big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('inspect', S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>🧜‍♀️ '+t('ph_lady')+'</h2><div class="hint" style="margin-bottom:0">'+t('ladyWait', esc(nickOf(ho)))+'</div>';
  } else if(g.phase==='loyalty'){
    if(g.loyalty&&g.loyalty.target===me) h='<h2>◐ '+t('loyaltyChoose')+'</h2><div class="hint">'+t('loyaltyHint')+'</div><div class="row"><button class="btn good big" data-loyalty="good" '+(busy?'disabled':'')+'>'+t('showGood')+'</button><button class="btn evil big" data-loyalty="evil" '+(busy?'disabled':'')+'>'+t('showEvil')+'</button></div>';
    else h='<h2>◐ '+t('ph_loyalty')+'</h2><div class="hint">'+t('loyaltyWait')+'</div>';
  } else if(g.phase==='recruit'){
    if(S.mine&&S.mine.role==='assassin') h='<h2>🗡️ '+t('recruitTitle')+'</h2><div class="hint">'+t('recruitMe')+'</div><button class="btn evil big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('inspect',S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>🗡️ '+t('recruitTitle')+'</h2><div class="hint">'+t('recruitWait')+'</div>';
  } else if(g.phase==='assassin'){
    if((g.recruitedPlayer&&g.recruitedPlayer===me)||(!g.recruitedPlayer&&S.mine&&S.mine.role==='assassin')) h='<h2>🗡️ '+t('assTitle')+'</h2><div class="hint">'+t('assMe')+'</div><button class="btn evil big" style="width:100%" data-a="single" '+(S.ui.pick.length!==1||busy?'disabled':'')+'>'+t('stab', S.ui.pick[0]?esc(nickOf(S.ui.pick[0])):'…')+'</button>';
    else h='<h2>🗡️ '+t('assTitle')+'</h2><div class="hint" style="margin-bottom:0">'+t('assWait')+(S.mine&&((S.mine.allegiance||side(S.mine.role))==='evil')?' '+t('assEvil'):'')+'</div>';
  }
  return '<div class="glass card act">'+h+actionStatus(g)+'</div>';
}
function roleBar(){
  const g=S.game; if(!g.order.includes(ME.pid)) return '';
  if(!S.mine) return '<div class="glass card muted">'+t('loadingRole')+'</div>';
  const s=S.mine.allegiance||side(S.mine.role);
  return '<button class="glass card rolebar '+(S.peek?s:'')+'" data-a="peek"><span class="rb-l"><span class="rb-ic">'+(S.peek?roleArt(S.mine.role,'rolebar-art'):'<span class="card-seal">V</span>')+'</span>'
    +'<span><div class="muted tiny">'+t('myRole')+'</div><b>'+(S.peek?rName(S.mine.role):'••••••')+'</b></span></span><span class="muted small">'+(S.peek?'🙈':t('tapReveal'))+'</span></button>'
    +(S.peek?'<div class="glass card" style="margin-top:-8px">'+knowBlock()+'</div>':'');
}
function hostToolsPanel(g){
  if(!isHost() || g.status!=='play') return '';
  const candidates=g.order.filter(p=>p!==ME.pid&&Net.isOnline(p));
  const options='<option value="">'+t('transferTo')+'</option>'+candidates.map(p=>'<option value="'+esc(p)+'" '+(S.ui.hostSuccessor===p?'selected':'')+'>'+esc(nickOf(p))+'</option>').join('');
  if(S.ui.confirmHostTransfer){
    const name=nickOf(S.ui.hostSuccessor);
    return '<section class="glass card host-tools confirm"><h3>♜ '+t('hostTools')+'</h3><p>'+t('transferWarning')+'</p><div class="row"><button class="btn evil" data-a="transferHost" '+(S.ui.busy?'disabled':'')+'>'+t('confirmTransfer',esc(name))+'</button><button class="btn ghost" data-a="cancelHostTransfer">'+t('close')+'</button></div></section>';
  }
  return '<section class="glass card host-tools"><h3>♜ '+t('hostTools')+'</h3><div class="row"><select class="host-select" id="hostSuccessor" aria-label="'+t('transferTo')+'">'+options+'</select><button class="btn" data-a="prepareHostTransfer" '+(!candidates.length?'disabled':'')+'>'+t('transferHost')+'</button></div></section>';
}
function knowBlock(){
  const m=S.mine; let h='<div class="small" style="margin-bottom:8px">'+rDesc(m.role)+'</div>';
  const person=(u,cls,label)=>'<span class="known-person '+cls+'"><span class="known-avatar player-avatar" style="'+avStyle(u)+'"></span><span><b>'+esc(nickOf(u))+'</b>'+(label?'<small>'+label+'</small>':'')+'</span></span>';
  if(m.allegiance&&m.allegiance!==side(m.role)) h+='<div class="know"><b class="'+(m.allegiance==='good'?'res-s':'res-f')+'">'+t('currentLoyalty',t(m.allegiance))+'</b></div>';
  if(m.see) h+='<div class="know"><div class="kl">'+t('youSee', t(m.see))+'</div><div class="known-people">'+((m.sees||[]).length?m.sees.map(u=>person(u,'clue',t(m.see))).join(''):t('none'))+'</div></div>';
  S.ladyMine.forEach(x=>{ h+='<div class="know"><div class="kl">🧜‍♀️ '+t('ladyLog')+'</div>'+person(x.target,x.side,t(x.side))+'</div>'; });
  S.checksMine.filter(x=>x.source!=='lady').forEach(x=>{ h+='<div class="know"><div class="kl">☩ '+t('inspected',esc(nickOf(x.target)),t(x.side))+'</div>'+person(x.target,x.side,t(x.side))+'</div>'; });
  return h;
}
function historyBlock(g){
  const rounds=g.rounds||[];
  if(!rounds.length) return '<div class="glass card log"><h3>'+t('history')+'</h3><div class="muted small">'+t('noHistory')+'</div></div>';
  const rows=rounds.slice().reverse().map(r=>{
    const qr=g.quests[r.q];
    const res = r.ok ? (qr && qr.r ? (qr.r==='S'?'<span class="res-s">✓ '+t('qSuccess')+'</span>':'<span class="res-f">✗ '+t('fails',qr.fails)+'</span>') : t('rOn')) : '<span class="res-r">'+t('rRejected')+'</span>';
    const yes=g.order.filter(u=>r.votes[u]), no=g.order.filter(u=>r.votes[u]===false);
    return '<tr><td><b>Q'+(r.q+1)+'</b><br><span class="muted tiny">'+t('try', r.att)+'</span></td><td>👑 '+esc(nickOf(r.leader))+'<br><span class="muted">'+r.team.map(u=>esc(nickOf(u))).join(', ')+'</span><br>'
      +yes.map(u=>'<span class="vchip y">✓'+esc(nickOf(u))+'</span>').join('')+no.map(u=>'<span class="vchip n">✗'+esc(nickOf(u))+'</span>').join('')+'</td><td>'+res+'</td></tr>';
  }).join('');
  return '<div class="glass card log"><h3>'+t('history')+'</h3><table><tr><th>'+t('round')+'</th><th>'+t('leaderTeam')+'</th><th>'+t('result')+'</th></tr>'+rows+'</table></div>';
}

/* ================= Overlays ================= */
function renderOverlay(){
  const el=$('#ov'); if(!el) return;
  if(S.ov.length && !(S.game && S.game.order && S.game.gid)) S.ov=[]; // game was reset to the lobby
  const o=S.ov[0];
  if(!o){ if(el.innerHTML) el.innerHTML=''; el._k=null; return; }
  const key=JSON.stringify([o.type, o.flipped, o.qi, o.r && o.r.att, o.r && o.r.q, LANG, S.mine && S.mine.role]);
  if(el._k===key) return; // keep animations from restarting
  el._k=key;
  const g=S.game; let h='';
  if(o.type==='night'){
    const m=S.mine; if(!m){ S.ov.shift(); return renderOverlay(); }
    const s=m.allegiance||side(m.role);
    h='<h2>🌙 '+t('nightTitle')+'</h2><p class="lead">'+t('nightLead')+'</p>'
      +'<div class="rolecard '+(o.flipped?'flip':'')+'" data-a="flipcard"><div class="in"><div class="face back"><div class="card-seal large">V</div><span>AVALON</span></div>'
      +'<div class="face front '+s+'">'+roleArt(m.role,'rolecard-art')+'<div class="rolecard-caption"><div class="rs">'+t(s)+'</div><div class="rn">'+rName(m.role)+'</div></div></div></div></div>'
      +(o.flipped?knowBlock()+'<button class="btn pri big" style="width:100%" data-a="ovnext">'+t('gotIt')+'</button>':'<button class="btn pri big" style="width:100%" data-a="flipcard">'+t('flip')+'</button>');
  } else if(o.type==='vote'){
    const r=o.r, yes=Object.values(r.votes).filter(Boolean).length, no=Object.keys(r.votes).length-yes;
    h='<h2>🗳️ '+t('voteReveal')+'</h2><p class="lead">'+t('questN', r.q+1)+' · '+t('try', r.att)+'</p>'
      +'<div class="bigres '+(r.ok?'good':'evil')+'">'+(r.ok?t('passed'):t('rejected'))+'</div><p class="muted">'+t('yesNo', yes, no)+'</p>'
      +'<div class="vlist">'+g.order.map((u,i)=>'<div style="animation-delay:'+(i*60)+'ms"><span>'+esc(nickOf(u))+'</span><span class="vchip '+(r.votes[u]?'y':'n')+'">'+(r.votes[u]?'✓ '+t('approve'):'✗ '+t('reject'))+'</span></div>').join('')+'</div>'
      +'<button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='quest'){
    const q=g.quests[o.qi]; const cards=shuffle(Array(q.size).fill('S').map((c,i)=>i<q.fails?'F':'S'));
    h='<h2>⚔️ '+t('questReveal', o.qi+1)+'</h2><p class="lead">'+q.team.map(u=>esc(nickOf(u))).join(' · ')+'</p>'
      +'<div class="cards">'+cards.map((c,i)=>'<div class="qcard" style="animation-delay:'+(400+i*450)+'ms"><div class="f b"></div><div class="f '+(c==='S'?'s':'x')+'">'+(c==='S'?'✓':'✗')+'</div></div>').join('')+'</div>'
      +'<div class="bigres '+(q.r==='S'?'good':'evil')+'" style="animation-delay:'+(600+q.size*450)+'ms">'+(q.r==='S'?t('qSuccess'):t('qFail'))+'</div>'
      +'<p class="muted">'+t('fails', q.fails)+(q.two?' · '+t('needTwo'):'')+'</p><button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='lady'){
    const x=o.x; h='<h2>🧜‍♀️ '+t('ph_lady')+'</h2><div class="bigres '+x.side+'" style="margin:18px 0">'+esc(nickOf(x.target))+' · '+t(x.side)+'</div><button class="btn pri big" style="width:100%" data-a="ovnext">OK</button>';
  } else if(o.type==='end'){
    const roles=g.roles||{};
    h=(g.assassinPick?'<h2>🗡️ '+t('assResult')+'</h2>'+assassinationResult(g):'<h2>'+(g.winner==='good'?'🛡️':'🗡️')+'</h2>')+'<div class="bigres '+g.winner+'">'+(g.winner==='good'?t('goodWin'):t('evilWin'))+'</div><p class="lead" style="margin-top:8px">'+t(g.reason)+'</p>'
      +'<div class="endroles">'+g.order.map(u=>'<div class="'+((g.allegiances&&g.allegiances[u])||side(roles[u]))+'"><span>'+esc(nickOf(u))+(u===ME.pid?' ('+t('you')+')':'')+'</span><b>'+ROLE_META[roles[u]].ic+' '+rName(roles[u])+'</b></div>').join('')+'</div>'
      +'<div class="row">'+(isHost()?'<button class="btn pri big" data-a="again">🔄 '+t('again')+'</button>':'')+'<button class="btn big" data-a="ovnext">'+t('close')+'</button></div>';
  }
  el.innerHTML='<div class="ov"><div class="glass ovbox">'+h+'</div></div>';
}

/* ================= Events ================= */
document.addEventListener('input', e=>{
  if(e.target.id==='nick') S.ui.nick=e.target.value;
  if(e.target.id==='joinCode') S.ui.joinCode=e.target.value.toUpperCase();
  if(e.target.matches&&e.target.matches('.note-text[data-note-player]')) savePrivateNote(e.target.dataset.notePlayer,'text',e.target.value);
});
document.addEventListener('change', e=>{
  if(e.target.matches&&e.target.matches('.note-select[data-note-player]')){ savePrivateNote(e.target.dataset.notePlayer,'mark',e.target.value); render(); }
  if(e.target.id==='hostSuccessor'){ S.ui.hostSuccessor=e.target.value; S.ui.confirmHostTransfer=false; render(); }
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && S.ui.confirm){ S.ui.confirm=null; renderConfirmModal(); return; }
  if(e.key==='Escape' && S.ui.qrOpen){ S.ui.qrOpen=false; renderQRModal(); return; }
  if(e.key==='Escape' && S.ui.infoOpen){ S.ui.infoOpen=null; renderInfoModal(); return; }
  if(e.key==='Escape' && S.ui.rulesOpen){ S.ui.rulesOpen=false; renderRulesModal(); return; }
  if(e.key==='Tab' && (S.ui.confirm || S.ui.qrOpen || S.ui.infoOpen || S.ui.rulesOpen)){
    const root=S.ui.confirm?$('#confirmModal'):S.ui.qrOpen?$('#qrModal'):S.ui.infoOpen?$('#infoModal'):$('#rulesModal');
    const items=root&&[...root.querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);
    if(items&&items.length){ const first=items[0], last=items[items.length-1]; if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); } }
  }
  if(e.key!=='Enter') return;
  if(e.target.id==='joinCode') joinRoom();
  else if(e.target.id==='nick'){ if(!S.code) createRoom(); else if(S.seats[ME.pid]) renameSeat(); else takeSeat(); }
});
document.addEventListener('toggle', e=>{
  if(e.target.matches && e.target.matches('details.rules')) S.ui.rulesInlineOpen=e.target.open;
  if(e.target.matches && e.target.matches('details.settings-advanced')) S.ui.settingsOpen=e.target.open;
}, true);
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-a],[data-pick],[data-vote],[data-quest],[data-kick],[data-set],[data-preset],[data-excalibur],[data-loyalty],[data-reaction]'); if(!b) return;
  if(b.dataset.reaction) return sendReaction(b.dataset.reaction);
  if(b.dataset.kick) return askConfirm(t('confirmKick',nickOf(b.dataset.kick)),'kick',b.dataset.kick,[b.dataset.kick]);
  if(b.dataset.set) return toggleSetting(b.dataset.set);
  if(b.dataset.preset) return applyPreset(b.dataset.preset);
  if(b.dataset.excalibur){ S.ui.excalibur=b.dataset.excalibur; return render(); }
  if(b.dataset.loyalty) return submit(b.dataset.loyalty);
  if(b.dataset.pick){
    const pm=pickMode(S.game), u=b.dataset.pick; if(!pm) return;
    if(pm.max===1) S.ui.pick = S.ui.pick[0]===u ? [] : [u];
    else if(S.ui.pick.includes(u)) S.ui.pick=S.ui.pick.filter(x=>x!==u);
    else if(S.ui.pick.length<pm.max) S.ui.pick=S.ui.pick.concat([u]);
    else toast(t('toMany', pm.max));
    if(S.ui.excalibur && !S.ui.pick.includes(S.ui.excalibur)) S.ui.excalibur=null;
    if(S.game.phase==='propose' && S.game.order[S.game.leader]===ME.pid) Net.draftTeam(ME.pid,S.game.step,S.ui.pick.slice());
    return render();
  }
  if(b.dataset.vote) return submit(b.dataset.vote==='1');
  if(b.dataset.quest){ S.ui.questConfirm=b.dataset.quest; return render(); }
  switch(b.dataset.a){
    case 'home': return S.code ? goHome(false) : render();
    case 'lang': LANG = LANG==='zh'?'en':'zh'; LS.set('lang', LANG); document.documentElement.lang = LANG==='zh'?'zh-CN':'en'; return render();
    case 'rules': S.ui.guideTab=S.game&&S.game.status==='lobby'?'lineup':'rules'; S.ui.rulesOpen=true; return renderRulesModal();
    case 'rulesLineup': S.ui.guideTab='lineup'; S.ui.rulesOpen=true; return renderRulesModal();
    case 'rulesFull': S.ui.guideTab='rules'; S.ui.rulesOpen=true; return renderRulesModal();
    case 'closeRules': S.ui.rulesOpen=false; return renderRulesModal();
    case 'info': S.ui.infoOpen=b.dataset.info; return renderInfoModal();
    case 'closeInfo': S.ui.infoOpen=null; return renderInfoModal();
    case 'qr': S.ui.qrOpen=true; return renderQRModal();
    case 'closeQR': S.ui.qrOpen=false; return renderQRModal();
    case 'confirmCancel': S.ui.confirm=null; return renderConfirmModal();
    case 'confirmRun': return runConfirmed();
    case 'privacyCover': S.ui.privacyCover=!S.ui.privacyCover; if(S.ui.privacyCover) S.peek=false; return render();
    case 'questSubmit': { const v=S.ui.questConfirm; S.ui.questConfirm=null; return v?submit(v):render(); }
    case 'questCancel': S.ui.questConfirm=null; return render();
    case 'prepareHostTransfer': if(!S.ui.hostSuccessor) return toast(t('chooseHost')); S.ui.confirmHostTransfer=true; return render();
    case 'cancelHostTransfer': S.ui.confirmHostTransfer=false; return render();
    case 'transferHost': return transferHost();
    case 'toggleNotes': S.ui.notesOpen=!S.ui.notesOpen; return render();
    case 'clearNotes': { const key=notesStorageKey(); if(key) LS.del(key); render(); return toast(t('notesCleared')); }
    case 'create': return createRoom();
    case 'join': return joinRoom();
    case 'resume': { const l=LS.get('last'); if(l) enterRoom(l); return; }
    case 'seat': return takeSeat();
    case 'rename': return renameSeat();
    case 'leave': return S.game&&S.game.status!=='lobby' ? askConfirm(t('confirmLeave'),'leave') : leaveRoom();
    case 'start': return startGame();
    case 'again': return askConfirm(t('confirmAgain'),'again');
    case 'propose': {
      const team=S.ui.pick.slice(), value=S.game.settings.excalibur?{team,excalibur:S.ui.excalibur}:team;
      return askConfirm(t('confirmTeam',team.map(nickOf).join(LANG==='zh'?'、':', ')),'propose',value,team,t('confirmTeamAction'));
    }
    case 'single': {
      const target=S.ui.pick[0]; if(!target) return;
      if(S.game.phase==='assassin') return askConfirm(t('confirmAssassin',nickOf(target)),'submit',target,[target]);
      if(S.game.phase==='excalibur') return askConfirm(t('confirmExcalibur',nickOf(target)),'submit',target,[target]);
      return submit(target);
    }
    case 'excaliburSkip': return submit(null);
    case 'peek': S.peek=!S.peek; return render();
    case 'flipcard': if(S.ov[0] && S.ov[0].type==='night'){ S.ov[0].flipped=true; renderOverlay(); } return;
    case 'ovnext': S.ov.shift(); return renderOverlay();
    case 'showend': S.ov.push({type:'end'}); return renderOverlay();
    case 'copy': {
      const link=location.origin+location.pathname+'#'+S.game.code;
      const ok=()=>toast(t('copied')), fail=()=>toast(link);
      try{ navigator.clipboard.writeText(link).then(ok, fail); }catch(err){ fail(); }
      return;
    }
    case 'share': {
      const link=location.origin+location.pathname+'#'+S.game.code;
      navigator.share({title:'Avalon '+S.game.code, text:'Avalon · '+S.game.code, url:link}).catch(()=>{});
      return;
    }
  }
});
window.addEventListener('hashchange', ()=>{
  const h=(location.hash||'').slice(1).toUpperCase();
  if(/^[A-Z0-9]{4,8}$/.test(h) && h!==S.code) enterRoom(h);
});

S.bootAt=Date.now();
if('serviceWorker' in navigator && location.protocol==='https:') window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(e=>console.warn('service worker',e)));
boot();
