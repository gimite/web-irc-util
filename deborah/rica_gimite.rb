#
# rica.rb
#   -- Ruby Internet relay Chat Agents (based on RFC1459)
#   NISHI Takao <zophos@koka-in.org>
#
# $Id: rica.rb,v 1.3 2007/08/16 11:50:54 gimite Exp $
#
require 'socket'
require 'thread'
require 'kconv'
require 'nkf'
require 'observer'
require 'singleton'
require 'delegate'

module Rica
        
    RICA_NAME="Rica"
    RICA_VERION="0.10"
    RICA_FULLNAME="Ruby Internet relay Chat Agents"
    RICA_INFO_URL="http://www.koka-in.org/%7Ezophos/SideA/lsnt/rica.html"

    RICA_PRIVMSG_MAX_LEN=255

    ############################################################
    #
    # Irc events and event processing modules template
    #
    # In this library, Irc messages are assumed as event.
    #
    module Event
        #
        # RFC1459 Commands (include optional)
        #
        CMND_UNKNOWN=0
        CMND_PASS=1
        CMND_NICK=2
        CMND_USER=3
        CMND_SERVER=4
        CMND_OPER=5
        CMND_QUIT=6
        CMND_SQUIT=7
        CMND_JOIN=8
        CMND_PART=9
        CMND_MODE=10
        CMND_TOPIC=11
        CMND_NAMES=12
        CMND_LIST=13
        CMND_INVITE=14
        CMND_KICK=15
        CMND_VERSION=16
        CMND_STATAS=17
        CMND_LINK=18
        CMND_TIME=19
        CMND_CONNECT=20
        CMND_TRACE=21
        CMND_ADMIN=22
        CMND_INFO=23
        CMND_PRIVMSG=24
        CMND_NOTICE=25
        CMND_WHO=26
        CMND_WHOIS=27
        CMND_WHOWAS=28
        
        CMND_KILL=29
        CMND_PING=30
        CMND_PONG=31
        CMND_ERROR=32

        CMND_AWAY=33
        CMND_REHASH=34
        CMND_RESTART=35
        CMND_SUMMON=36
        CMND_USERS=37
        CMND_WALLOPS=38
        CMND_USERHOST=39
        CMND_ISON=40
        
        #
        # CTCP Messages
        #
        CMND_CTCP_QUERY=100
        CMND_CTCP_ANSWER=200
        CMND_CTCP_UNKNOWN=0
        CMND_CTCP_PING=1
        CMND_CTCP_ECHO=2
        CMND_CTCP_TIME=3
        CMND_CTCP_VERSION=4
        CMND_CTCP_CLIENTINFO=5
        CMND_CTCP_USERINFO=6
        CMND_CTCP_ACTION=7
        CMND_CTCP_DCC=8

        #
        # Socket event
        #
        LINK_ESTABLISHING=-1
        LINK_ESTABLISHED=-2
        LINK_FAILED=-3
        LINK_CLOSING=-4
        LINK_CLOSED=-5
        
        #
        # Low level Irc event
        #
        RECV_MESSAGE=10000
        RECV_MESSAGE_BROKEN=10000
        RECV_MESSAGE_KILL=10001
        RECV_MESSAGE_PING=10002
        RECV_MESSAGE_PONG=10003
        RECV_MESSAGE_ERROR=10004
        RECV_MESSAGE_NOTICE=10005
        
        #
        # RFC1459 messages
        #
        RECV_RPL_INIT=1 # Not listed in RFC1459, but many servers say
        RECV_RPL_TRACELINK=200
        RECV_RPL_TRACECONNECTING=201
        RECV_RPL_TRACEHANDSHAKE=202
        RECV_RPL_TRACEUNKNOWN=203
        RECV_RPL_TRACEOPERATOR=204
        RECV_RPL_TRACEUSER=205
        RECV_RPL_TRACESERVER=206
        RECV_RPL_TRACENEWTYPE=208
        RECV_RPL_STATSLINKINF=211
        RECV_RPL_STATSCOMMANDS=212
        RECV_RPL_STATSCLINE=213
        RECV_RPL_STATSNLINE=214
        RECV_RPL_STATSILINE=215
        RECV_RPL_STATSKLINE=216
        RECV_RPL_STATSYLINE=218
        RECV_RPL_ENDOFSTATS=219
        RECV_RPL_UMODEIS=221
        RECV_RPL_STATSLLINE=241
        RECV_RPL_STATSUPTIME=242
        RECV_RPL_STATSOLINE=243
        RECV_RPL_STATSHLINE=244
        RECV_RPL_LUSERCLIENT=251
        RECV_RPL_LUSEROP=252
        RECV_RPL_LUSERUNKNOWN=253
        RECV_RPL_LUSERCHANNELS=254
        RECV_RPL_LUSERME=255
        RECV_RPL_ADMINME=256
        RECV_RPL_ADMINLOC1=257
        RECV_RPL_ADMINLOC2=258
        RECV_RPL_ADMINEMAIL=259
        RECV_RPL_TRACELOG=261
        RECV_RPL_NONE=300
        RECV_RPL_AWAY=301
        RECV_RPL_USERHOST=302
        RECV_RPL_ISON=303
        RECV_RPL_UNAWAY=305
        RECV_RPL_NOWAWAY=306
        RECV_RPL_WHOISUSER=311
        RECV_RPL_WHOISSERVER=312
        RECV_RPL_WHOISOPERATOR=313
        RECV_RPL_WHOWASUSER=314
        RECV_RPL_ENDOFWHO=315
        RECV_RPL_WHOISIDLE=317
        RECV_RPL_ENDOFWHOIS=318
        RECV_RPL_WHOISCHANNELS=319
        RECV_RPL_LISTSTART=321
        RECV_RPL_LIST=322
        RECV_RPL_LISTEND=323
        RECV_RPL_CHANNELMODEIS=324
        RECV_RPL_NOTOPIC=331
        RECV_RPL_TOPIC=332
        RECV_RPL_INVITING=341
        RECV_RPL_SUMMONING=342
        RECV_RPL_VERSION=351
        RECV_RPL_WHOREPLY=352
        RECV_RPL_NAMREPLY=353
        RECV_RPL_LINKS=364
        RECV_RPL_ENDOFLINKS=365
        RECV_RPL_ENDOFNAME=366
        RECV_RPL_BANLIST=367
        RECV_RPL_ENDOFBANLIST=368
        RECV_RPL_ENDOFWHOWAS=369
        RECV_RPL_INFO=371
        RECV_RPL_MOTD=372
        RECV_RPL_ENDOFINFO=374
        RECV_RPL_MOTDSTART=375
        RECV_RPL_ENDOFMOTD=376
        RECV_RPL_YOUREOPER=381
        RECV_RPL_REHASHING=382
        RECV_RPL_TIME=391
        RECV_RPL_USERS=393
        RECV_RPL_ENDOFUSERS=394
        RECV_RPL_NOUSERS=395

        RECV_ERR_NOSUCHNICK=401
        RECV_ERR_NOSUCHSERVE=402
        RECV_ERR_NOSUCHCHANNEL=403
        RECV_ERR_CANNOTSENDTOCHAN=404
        RECV_ERR_TOOMANYCHANNELS=405
        RECV_ERR_WASNOSUCHNICK=406
        RECV_ERR_TOOMANYTARGETS=407
        RECV_ERR_NOORIGIN=409
        RECV_ERR_NORECIPIENT=411
        RECV_ERR_NOTEXTTOSEND=412
        RECV_ERR_NOTOPLEVE=413
        RECV_ERR_WILDTOPLEVEL=414
        RECV_ERR_UNKNOWNCOMMAND=421
        RECV_ERR_NOMOTD=422
        RECV_ERR_NOADMININFO=423
        RECV_ERR_FILEERROR=424
        RECV_ERR_NONICKNAMEGIVEN=431
        RECV_ERR_ERRONEUSNICKNAME=432
        RECV_ERR_NICKNAMEINUSE=433
        RECV_ERR_NICKCOLLISION=436
        RECV_ERR_USERNOTINCHANNEL=441
        RECV_ERR_NOTONCHANNE=442
        RECV_ERR_USERONCHANNEL=443
        RECV_ERR_NOLOGIN=444
        RECV_ERR_SUMMONDISABLED=445
        RECV_ERR_USERSDISABLED=446
        RECV_ERR_NOTREGISTERED=451
        RECV_ERR_NEEDMOREPARAM=461
        RECV_ERR_ALREADYREGISTRE=462
        RECV_ERR_NOPERMFORHOST=463
        RECV_ERR_PASSWDMISMATCH=464
        RECV_ERR_YOUREBANNEDCREEP=465
        RECV_ERR_KEYSET=467
        RECV_ERR_CHANNELISFULL=471
        RECV_ERR_UNKNOWNMODE=472
        RECV_ERR_INVITEONLYCHAN=473
        RECV_ERR_BANNEDFROMCHAN=474
        RECV_ERR_BADCHANNELKEY=475
        RECV_ERR_NOPRIVILEGES=481
        RECV_ERR_CHANOPRIVSNEEDED=482
        RECV_ERR_CANTKILLSERVER=483
        RECV_ERR_NOOPERHOST=491
        RECV_ERR_UMODEUNKNOWNFLAG=501
        RECV_ERR_USERSDONTMATCH=502
        
        RECV_CMND=1000
        
        RECV_CMND_UNKNOWN=RECV_CMND+CMND_UNKNOWN
        RECV_CMND_PASS=RECV_CMND+CMND_PASS
        RECV_CMND_NICK=RECV_CMND+CMND_NICK
        RECV_CMND_USER=RECV_CMND+CMND_USER
        RECV_CMND_SERVER=RECV_CMND+CMND_SERVER
        RECV_CMND_OPER=RECV_CMND+CMND_OPER
        RECV_CMND_QUIT=RECV_CMND+CMND_QUIT
        RECV_CMND_SQUIT=RECV_CMND+CMND_SQUIT
        RECV_CMND_JOIN=RECV_CMND+CMND_JOIN
        RECV_CMND_PART=RECV_CMND+CMND_PART
        RECV_CMND_MODE=RECV_CMND+CMND_MODE
        RECV_CMND_TOPIC=RECV_CMND+CMND_TOPIC
        RECV_CMND_NAMES=RECV_CMND+CMND_NAMES
        RECV_CMND_LIST=RECV_CMND+CMND_LIST
        RECV_CMND_INVITE=RECV_CMND+CMND_INVITE
        RECV_CMND_KICK=RECV_CMND+CMND_KICK
        RECV_CMND_VERSION=RECV_CMND+CMND_VERSION
        RECV_CMND_STATAS=RECV_CMND+CMND_STATAS
        RECV_CMND_LINK=RECV_CMND+CMND_LINK
        RECV_CMND_TIME=RECV_CMND+CMND_TIME
        RECV_CMND_CONNECT=RECV_CMND+CMND_CONNECT
        RECV_CMND_TRACE=RECV_CMND+CMND_TRACE
        RECV_CMND_ADMIN=RECV_CMND+CMND_ADMIN
        RECV_CMND_INFO=RECV_CMND+CMND_INFO
        RECV_CMND_PRIVMSG=RECV_CMND+CMND_PRIVMSG
        RECV_CMND_NOTICE=RECV_CMND+CMND_NOTICE
        RECV_CMND_WHO=RECV_CMND+CMND_WHO
        RECV_CMND_WHOIS=RECV_CMND+CMND_WHOIS
        RECV_CMND_WHOWAS=RECV_CMND+CMND_WHOWAS
        
        RECV_CMND_KILL=RECV_CMND+CMND_KILL
        RECV_CMND_PING=RECV_CMND+CMND_PING
        RECV_CMND_PONG=RECV_CMND+CMND_PONG
        RECV_CMND_ERROR=RECV_CMND+CMND_ERROR
        
        RECV_CMND_AWAY=RECV_CMND+CMND_AWAY
        RECV_CMND_REHASH=RECV_CMND+CMND_REHASH
        RECV_CMND_RESTART=RECV_CMND+CMND_RESTART
        RECV_CMND_SUMMON=RECV_CMND+CMND_SUMMON
        RECV_CMND_USERS=RECV_CMND+CMND_USERS
        RECV_CMND_WALLOPS=RECV_CMND+CMND_WALLOPS
        RECV_CMND_USERHOST=RECV_CMND+CMND_USERHOST
        RECV_CMND_ISON=RECV_CMND+CMND_ISON
        
        RECV_CMND_CTCP_QUERY=RECV_CMND+CMND_CTCP_QUERY
        RECV_CMND_CTCP_QUERY_UNKNOWN=RECV_CMND_CTCP_QUERY+
            CMND_CTCP_UNKNOWN
        RECV_CMND_CTCP_QUERY_PING=RECV_CMND_CTCP_QUERY+CMND_CTCP_PING
        RECV_CMND_CTCP_QUERY_ECHO=RECV_CMND_CTCP_QUERY+CMND_CTCP_ECHO
        RECV_CMND_CTCP_QUERY_TIME=RECV_CMND_CTCP_QUERY+CMND_CTCP_TIME
        RECV_CMND_CTCP_QUERY_VERSION=RECV_CMND_CTCP_QUERY+
            CMND_CTCP_VERSION
        RECV_CMND_CTCP_QUERY_CLIENTINFO=RECV_CMND_CTCP_QUERY+
            CMND_CTCP_CLIENTINFO
        RECV_CMND_CTCP_QUERY_USERINFO=RECV_CMND_CTCP_QUERY+
            CMND_CTCP_USERINFO
        RECV_CMND_CTCP_QUERY_ACTION=RECV_CMND_CTCP_QUERY+
            CMND_CTCP_ACTION
        RECV_CMND_CTCP_QUERY_DCC=RECV_CMND_CTCP_QUERY+
            CMND_CTCP_DCC

        RECV_CMND_CTCP_ANSWER=RECV_CMND+CMND_CTCP_ANSWER
        RECV_CMND_CTCP_ANSWER_UNKNOWN=RECV_CMND_CTCP_ANSWER+
            CMND_CTCP_UNKNOWN
        RECV_CMND_CTCP_ANSWER_PING=RECV_CMND_CTCP_ANSWER+CMND_CTCP_PING
        RECV_CMND_CTCP_ANSWER_ECHO=RECV_CMND_CTCP_ANSWER+CMND_CTCP_ECHO
        RECV_CMND_CTCP_ANSWER_TIME=RECV_CMND_CTCP_ANSWER+CMND_CTCP_TIME
        RECV_CMND_CTCP_ANSWER_VERSION=RECV_CMND_CTCP_ANSWER+
            CMND_CTCP_VERSION
        RECV_CMND_CTCP_ANSWER_CLIENTINFO=RECV_CMND_CTCP_ANSWER+
            CMND_CTCP_CLIENTINFO
        RECV_CMND_CTCP_ANSWER_USERINFO=RECV_CMND_CTCP_ANSWER+
            CMND_CTCP_USERINFO
        RECV_CMND_CTCP_ANSWER_ACTION=RECV_CMND_CTCP_ANSWER+
            CMND_CTCP_ACTION
        RECV_CMND_CTCP_ANSWER_DCC=RECV_CMND_CTCP_ANSWER+
            CMND_CTCP_DCC
        
        USER_EVENT=10000

        ########################################################
        #
        # Message dispatching method
        #
        # Args:
        #   Rica::Message msg
        #
        # Return:
        #   as you like (default is nil)
        #
        def dispatch(msg)
            case msg.command
            when LINK_ESTABLISHING
                ret=on_link_establishing(msg)
            when LINK_ESTABLISHED
                ret=on_link_established(msg)
            when LINK_FAILED
                ret=on_link_failed(msg)
            when LINK_CLOSING
                ret=on_link_closing(msg)
            when LINK_CLOSED
                ret=on_link_closed(msg)
            when RECV_MESSAGE
                ret=on_recv_message(msg)
            when RECV_MESSAGE_BROKEN
                ret=on_recv_message_broken(msg)
            when RECV_MESSAGE_KILL
                ret=on_recv_message_kill(msg)
            when RECV_MESSAGE_PING
                ret=on_recv_message_ping(msg)
            when RECV_MESSAGE_PONG
                ret=on_recv_message_pong(msg)
            when RECV_MESSAGE_ERROR
                ret=on_recv_message_error(msg)
            when RECV_MESSAGE_NOTICE
                ret=on_recv_message_notice(msg)
            when RECV_RPL_INIT
                ret=on_recv_rpl_init(msg)
            when RECV_RPL_TRACELINK
                ret=on_recv_rpl_tracelink(msg)
            when RECV_RPL_TRACECONNECTING
                ret=on_recv_rpl_traceconnecting(msg)
            when RECV_RPL_TRACEHANDSHAKE
                ret=on_recv_rpl_tracehandshake(msg)
            when RECV_RPL_TRACEUNKNOWN
                ret=on_recv_rpl_traceunknown(msg)
            when RECV_RPL_TRACEOPERATOR
                ret=on_recv_rpl_traceoperator(msg)
            when RECV_RPL_TRACEUSER
                ret=on_recv_rpl_traceuser(msg)
            when RECV_RPL_TRACESERVER
                ret=on_recv_rpl_traceserver(msg)
            when RECV_RPL_TRACENEWTYPE
                ret=on_recv_rpl_tracenewtype(msg)
            when RECV_RPL_STATSLINKINF
                ret=on_recv_rpl_statslinkinf(msg)
            when RECV_RPL_STATSCOMMANDS
                ret=on_recv_rpl_statscommands(msg)
            when RECV_RPL_STATSCLINE
                ret=on_recv_rpl_statscline(msg)
            when RECV_RPL_STATSNLINE
                ret=on_recv_rpl_statsnline(msg)
            when RECV_RPL_STATSILINE
                ret=on_recv_rpl_statsiline(msg)
            when RECV_RPL_STATSKLINE
                ret=on_recv_rpl_statskline(msg)
            when RECV_RPL_STATSYLINE
                ret=on_recv_rpl_statsyline(msg)
            when RECV_RPL_ENDOFSTATS
                ret=on_recv_rpl_endofstats(msg)
            when RECV_RPL_UMODEIS
                ret=on_recv_rpl_umodeis(msg)
            when RECV_RPL_STATSLLINE
                ret=on_recv_rpl_statslline(msg)
            when RECV_RPL_STATSUPTIME
                ret=on_recv_rpl_statsuptime(msg)
            when RECV_RPL_STATSOLINE
                ret=on_recv_rpl_statsoline(msg)
            when RECV_RPL_STATSHLINE
                ret=on_recv_rpl_statshline(msg)
            when RECV_RPL_LUSERCLIENT
                ret=on_recv_rpl_luserclient(msg)
            when RECV_RPL_LUSEROP
                ret=on_recv_rpl_luserop(msg)
            when RECV_RPL_LUSERUNKNOWN
                ret=on_recv_rpl_luserunknown(msg)
            when RECV_RPL_LUSERCHANNELS
                ret=on_recv_rpl_luserchannels(msg)
            when RECV_RPL_LUSERME
                ret=on_recv_rpl_luserme(msg)
            when RECV_RPL_ADMINME
                ret=on_recv_rpl_adminme(msg)
            when RECV_RPL_ADMINLOC1
                ret=on_recv_rpl_adminloc1(msg)
            when RECV_RPL_ADMINLOC2
                ret=on_recv_rpl_adminloc2(msg)
            when RECV_RPL_ADMINEMAIL
                ret=on_recv_rpl_adminemail(msg)
            when RECV_RPL_TRACELOG
                ret=on_recv_rpl_tracelog(msg)
            when RECV_RPL_NONE
                ret=on_recv_rpl_none(msg)
            when RECV_RPL_AWAY
                ret=on_recv_rpl_away(msg)
            when RECV_RPL_USERHOST
                ret=on_recv_rpl_userhost(msg)
            when RECV_RPL_ISON
                ret=on_recv_rpl_ison(msg)
            when RECV_RPL_UNAWAY
                ret=on_recv_rpl_unaway(msg)
            when RECV_RPL_NOWAWAY
                ret=on_recv_rpl_nowaway(msg)
            when RECV_RPL_WHOISUSER
                ret=on_recv_rpl_whoisuser(msg)
            when RECV_RPL_WHOISSERVER
                ret=on_recv_rpl_whoisserver(msg)
            when RECV_RPL_WHOISOPERATOR
                ret=on_recv_rpl_whoisoperator(msg)
            when RECV_RPL_WHOWASUSER
                ret=on_recv_rpl_whowasuser(msg)
            when RECV_RPL_ENDOFWHO
                ret=on_recv_rpl_endofwho(msg)
            when RECV_RPL_WHOISIDLE
                ret=on_recv_rpl_whoisidle(msg)
            when RECV_RPL_ENDOFWHOIS
                ret=on_recv_rpl_endofwhois(msg)
            when RECV_RPL_WHOISCHANNELS
                ret=on_recv_rpl_whoischannels(msg)
            when RECV_RPL_LISTSTART
                ret=on_recv_rpl_liststart(msg)
            when RECV_RPL_LIST
                ret=on_recv_rpl_list(msg)
            when RECV_RPL_LISTEND
                ret=on_recv_rpl_listend(msg)
            when RECV_RPL_CHANNELMODEIS
                ret=on_recv_rpl_channelmodeis(msg)
            when RECV_RPL_NOTOPIC
                ret=on_recv_rpl_notopic(msg)
            when RECV_RPL_TOPIC
                ret=on_recv_rpl_topic(msg)
            when RECV_RPL_INVITING
                ret=on_recv_rpl_inviting(msg)
            when RECV_RPL_SUMMONING
                ret=on_recv_rpl_summoning(msg)
            when RECV_RPL_VERSION
                ret=on_recv_rpl_version(msg)
            when RECV_RPL_WHOREPLY
                ret=on_recv_rpl_whoreply(msg)
            when RECV_RPL_NAMREPLY
                ret=on_recv_rpl_namreply(msg)
            when RECV_RPL_LINKS
                ret=on_recv_rpl_links(msg)
            when RECV_RPL_ENDOFLINKS
                ret=on_recv_rpl_endoflinks(msg)
            when RECV_RPL_ENDOFNAME
                ret=on_recv_rpl_endofname(msg)
            when RECV_RPL_BANLIST
                ret=on_recv_rpl_banlist(msg)
            when RECV_RPL_ENDOFBANLIST
                ret=on_recv_rpl_endofbanlist(msg)
            when RECV_RPL_ENDOFWHOWAS
                ret=on_recv_rpl_endofwhowas(msg)
            when RECV_RPL_INFO
                ret=on_recv_rpl_info(msg)
            when RECV_RPL_MOTD
                ret=on_recv_rpl_motd(msg)
            when RECV_RPL_ENDOFINFO
                ret=on_recv_rpl_endofinfo(msg)
            when RECV_RPL_MOTDSTART
                ret=on_recv_rpl_motdstart(msg)
            when RECV_RPL_ENDOFMOTD
                ret=on_recv_rpl_endofmotd(msg)
            when RECV_RPL_YOUREOPER
                ret=on_recv_rpl_youreoper(msg)
            when RECV_RPL_REHASHING
                ret=on_recv_rpl_rehashing(msg)
            when RECV_RPL_TIME
                ret=on_recv_rpl_time(msg)
            when RECV_RPL_USERS
                ret=on_recv_rpl_users(msg)
            when RECV_RPL_ENDOFUSERS
                ret=on_recv_rpl_endofusers(msg)
            when RECV_RPL_NOUSERS
                ret=on_recv_rpl_nousers(msg)
            when RECV_ERR_NOSUCHNICK
                ret=on_recv_err_nosuchnick(msg)
            when RECV_ERR_NOSUCHSERVE
                ret=on_recv_err_nosuchserve(msg)
            when RECV_ERR_NOSUCHCHANNEL
                ret=on_recv_err_nosuchchannel(msg)
            when RECV_ERR_CANNOTSENDTOCHAN
                ret=on_recv_err_cannotsendtochan(msg)
            when RECV_ERR_TOOMANYCHANNELS
                ret=on_recv_err_toomanychannels(msg)
            when RECV_ERR_WASNOSUCHNICK
                ret=on_recv_err_wasnosuchnick(msg)
            when RECV_ERR_TOOMANYTARGETS
                ret=on_recv_err_toomanytargets(msg)
            when RECV_ERR_NOORIGIN
                ret=on_recv_err_noorigin(msg)
            when RECV_ERR_NORECIPIENT
                ret=on_recv_err_norecipient(msg)
            when RECV_ERR_NOTEXTTOSEND
                ret=on_recv_err_notexttosend(msg)
            when RECV_ERR_NOTOPLEVE
                ret=on_recv_err_notopleve(msg)
            when RECV_ERR_WILDTOPLEVEL
                ret=on_recv_err_wildtoplevel(msg)
            when RECV_ERR_UNKNOWNCOMMAND
                ret=on_recv_err_unknowncommand(msg)
            when RECV_ERR_NOMOTD
                ret=on_recv_err_nomotd(msg)
            when RECV_ERR_NOADMININFO
                ret=on_recv_err_noadmininfo(msg)
            when RECV_ERR_FILEERROR
                ret=on_recv_err_fileerror(msg)
            when RECV_ERR_NONICKNAMEGIVEN
                ret=on_recv_err_nonicknamegiven(msg)
            when RECV_ERR_ERRONEUSNICKNAME
                ret=on_recv_err_erroneusnickname(msg)
            when RECV_ERR_NICKNAMEINUSE
                ret=on_recv_err_nicknameinuse(msg)
            when RECV_ERR_NICKCOLLISION
                ret=on_recv_err_nickcollision(msg)
            when RECV_ERR_USERNOTINCHANNEL
                ret=on_recv_err_usernotinchannel(msg)
            when RECV_ERR_NOTONCHANNE
                ret=on_recv_err_notonchanne(msg)
            when RECV_ERR_USERONCHANNEL
                ret=on_recv_err_useronchannel(msg)
            when RECV_ERR_NOLOGIN
                ret=on_recv_err_nologin(msg)
            when RECV_ERR_SUMMONDISABLED
                ret=on_recv_err_summondisabled(msg)
            when RECV_ERR_USERSDISABLED
                ret=on_recv_err_usersdisabled(msg)
            when RECV_ERR_NOTREGISTERED
                ret=on_recv_err_notregistered(msg)
            when RECV_ERR_NEEDMOREPARAM
                ret=on_recv_err_needmoreparam(msg)
            when RECV_ERR_ALREADYREGISTRE
                ret=on_recv_err_alreadyregistre(msg)
            when RECV_ERR_NOPERMFORHOST
                ret=on_recv_err_nopermforhost(msg)
            when RECV_ERR_PASSWDMISMATCH
                ret=on_recv_err_passwdmismatch(msg)
            when RECV_ERR_YOUREBANNEDCREEP
                ret=on_recv_err_yourebannedcreep(msg)
            when RECV_ERR_KEYSET
                ret=on_recv_err_keyset(msg)
            when RECV_ERR_CHANNELISFULL
                ret=on_recv_err_channelisfull(msg)
            when RECV_ERR_UNKNOWNMODE
                ret=on_recv_err_unknownmode(msg)
            when RECV_ERR_INVITEONLYCHAN
                ret=on_recv_err_inviteonlychan(msg)
            when RECV_ERR_BANNEDFROMCHAN
                ret=on_recv_err_bannedfromchan(msg)
            when RECV_ERR_BADCHANNELKEY
                ret=on_recv_err_badchannelkey(msg)
            when RECV_ERR_NOPRIVILEGES
                ret=on_recv_err_noprivileges(msg)
            when RECV_ERR_CHANOPRIVSNEEDED
                ret=on_recv_err_chanoprivsneeded(msg)
            when RECV_ERR_CANTKILLSERVER
                ret=on_recv_err_cantkillserver(msg)
            when RECV_ERR_NOOPERHOST
                ret=on_recv_err_nooperhost(msg)
            when RECV_ERR_UMODEUNKNOWNFLAG
                ret=on_recv_err_umodeunknownflag(msg)
            when RECV_ERR_USERSDONTMATCH
                ret=on_recv_err_usersdontmatch(msg)
            when RECV_CMND_UNKNOWN
                ret=on_recv_cmnd_unknown(msg)
            when RECV_CMND_PASS
                ret=on_recv_cmnd_pass(msg)
            when RECV_CMND_NICK
                ret=on_recv_cmnd_nick(msg)
            when RECV_CMND_USER
                ret=on_recv_cmnd_user(msg)
            when RECV_CMND_SERVER
                ret=on_recv_cmnd_server(msg)
            when RECV_CMND_OPER
                ret=on_recv_cmnd_oper(msg)
            when RECV_CMND_QUIT
                ret=on_recv_cmnd_quit(msg)
            when RECV_CMND_SQUIT
                ret=on_recv_cmnd_squit(msg)
            when RECV_CMND_JOIN
                ret=on_recv_cmnd_join(msg)
            when RECV_CMND_PART
                ret=on_recv_cmnd_part(msg)
            when RECV_CMND_MODE
                ret=on_recv_cmnd_mode(msg)
            when RECV_CMND_TOPIC
                ret=on_recv_cmnd_topic(msg)
            when RECV_CMND_NAMES
                ret=on_recv_cmnd_names(msg)
            when RECV_CMND_LIST
                ret=on_recv_cmnd_list(msg)
            when RECV_CMND_INVITE
                ret=on_recv_cmnd_invite(msg)
            when RECV_CMND_KICK
                ret=on_recv_cmnd_kick(msg)
            when RECV_CMND_VERSION
                ret=on_recv_cmnd_version(msg)
            when RECV_CMND_STATAS
                ret=on_recv_cmnd_statas(msg)
            when RECV_CMND_LINK
                ret=on_recv_cmnd_link(msg)
            when RECV_CMND_TIME
                ret=on_recv_cmnd_time(msg)
            when RECV_CMND_CONNECT
                ret=on_recv_cmnd_connect(msg)
            when RECV_CMND_TRACE
                ret=on_recv_cmnd_trace(msg)
            when RECV_CMND_ADMIN
                ret=on_recv_cmnd_admin(msg)
            when RECV_CMND_INFO
                ret=on_recv_cmnd_info(msg)
            when RECV_CMND_PRIVMSG
                ret=on_recv_cmnd_privmsg(msg)
            when RECV_CMND_NOTICE
                ret=on_recv_cmnd_notice(msg)
            when RECV_CMND_WHO
                ret=on_recv_cmnd_who(msg)
            when RECV_CMND_WHOIS
                ret=on_recv_cmnd_whois(msg)
            when RECV_CMND_WHOWAS
                ret=on_recv_cmnd_whowas(msg)
            when RECV_CMND_KILL
                ret=on_recv_cmnd_kill(msg)
            when RECV_CMND_PING
                ret=on_recv_cmnd_ping(msg)
            when RECV_CMND_PONG
                ret=on_recv_cmnd_pong(msg)
            when RECV_CMND_ERROR
                ret=on_recv_cmnd_error(msg)
            when RECV_CMND_AWAY
                ret=on_recv_cmnd_away(msg)
            when RECV_CMND_REHASH
                ret=on_recv_cmnd_rehash(msg)
            when RECV_CMND_RESTART
                ret=on_recv_cmnd_restart(msg)
            when RECV_CMND_SUMMON
                ret=on_recv_cmnd_summon(msg)
            when RECV_CMND_USERS
                ret=on_recv_cmnd_users(msg)
            when RECV_CMND_WALLOPS
                ret=on_recv_cmnd_wallops(msg)
            when RECV_CMND_USERHOST
                ret=on_recv_cmnd_userhost(msg)
            when RECV_CMND_ISON
                ret=on_recv_cmnd_ison(msg)
            when RECV_CMND_CTCP_QUERY
                ret=on_recv_cmnd_ctcp_query(msg)
            when RECV_CMND_CTCP_QUERY_UNKNOWN
                ret=on_recv_cmnd_ctcp_query_unknown(msg)
            when RECV_CMND_CTCP_QUERY_PING
                ret=on_recv_cmnd_ctcp_query_ping(msg)
            when RECV_CMND_CTCP_QUERY_ECHO
                ret=on_recv_cmnd_ctcp_query_echo(msg)
            when RECV_CMND_CTCP_QUERY_TIME
                ret=on_recv_cmnd_ctcp_query_time(msg)
            when RECV_CMND_CTCP_QUERY_VERSION
                ret=on_recv_cmnd_ctcp_query_version(msg)
            when RECV_CMND_CTCP_QUERY_CLIENTINFO
                ret=on_recv_cmnd_ctcp_query_clientinfo(msg)
            when RECV_CMND_CTCP_QUERY_USERINFO
                ret=on_recv_cmnd_ctcp_query_userinfo(msg)
            when RECV_CMND_CTCP_QUERY_ACTION
                ret=on_recv_cmnd_ctcp_query_action(msg)
            when RECV_CMND_CTCP_QUERY_DCC
                ret=on_recv_cmnd_ctcp_query_dcc(msg)
            when RECV_CMND_CTCP_ANSWER
                ret=on_recv_cmnd_ctcp_answer(msg)
            when RECV_CMND_CTCP_ANSWER_UNKNOWN
                ret=on_recv_cmnd_ctcp_answer_unknown(msg)
            when RECV_CMND_CTCP_ANSWER_PING
                ret=on_recv_cmnd_ctcp_answer_ping(msg)
            when RECV_CMND_CTCP_ANSWER_ECHO
                ret=on_recv_cmnd_ctcp_answer_echo(msg)
            when RECV_CMND_CTCP_ANSWER_TIME
                ret=on_recv_cmnd_ctcp_answer_time(msg)
            when RECV_CMND_CTCP_ANSWER_VERSION
                ret=on_recv_cmnd_ctcp_answer_version(msg)
            when RECV_CMND_CTCP_ANSWER_CLIENTINFO
                ret=on_recv_cmnd_ctcp_answer_clientinfo(msg)
            when RECV_CMND_CTCP_ANSWER_USERINFO
                ret=on_recv_cmnd_ctcp_answer_userinfo(msg)
            when RECV_CMND_CTCP_ANSWER_ACTION
                ret=on_recv_cmnd_ctcp_answer_action(msg)
            when RECV_CMND_CTCP_ANSWER_DCC
                ret=on_recv_cmnd_ctcp_answer_dcc(msg)
            else
                ret=default_action(msg)
            end

            return ret
        end
        
        ########################################################
        #
        # on event methods
        #
        # Note that following methods are only template.
        # Pls implement nice functions at your classes.
        #

        #
        # default processing method
        #
        # Methods those you DO NOT override call this method
        #
        def default_action(msg)
            #
            # do nothing.
            #
        end

        def on_link(msg)
            default_action(msg)
        end
        alias on_link_establishing on_link
        alias on_link_established on_link
        alias on_link_failed on_link
        alias on_link_closed on_link
        
        def on_recv(msg)
            default_action(msg)
        end
        alias on_recv_message on_recv
        alias on_recv_message_broken on_recv_message
        alias on_recv_message_kill on_recv_message
        alias on_recv_message_ping on_recv_message
        alias on_recv_message_pong on_recv_message
        alias on_recv_message_error on_recv_message
        alias on_recv_message_notice on_recv_message
        
        alias on_recv_rpl on_recv
        alias on_recv_rpl_init on_recv_rpl
        alias on_recv_rpl_tracelink on_recv_rpl
        alias on_recv_rpl_traceconnecting on_recv_rpl
        alias on_recv_rpl_tracehandshake on_recv_rpl
        alias on_recv_rpl_traceunknown on_recv_rpl
        alias on_recv_rpl_traceoperator on_recv_rpl
        alias on_recv_rpl_traceuser on_recv_rpl
        alias on_recv_rpl_traceserver on_recv_rpl
        alias on_recv_rpl_tracenewtype on_recv_rpl
        alias on_recv_rpl_statslinkinf on_recv_rpl
        alias on_recv_rpl_statscommands on_recv_rpl
        alias on_recv_rpl_statscline on_recv_rpl
        alias on_recv_rpl_statsnline on_recv_rpl
        alias on_recv_rpl_statsiline on_recv_rpl
        alias on_recv_rpl_statskline on_recv_rpl
        alias on_recv_rpl_statsyline on_recv_rpl
        alias on_recv_rpl_endofstats on_recv_rpl
        alias on_recv_rpl_umodeis on_recv_rpl
        alias on_recv_rpl_statslline on_recv_rpl
        alias on_recv_rpl_statsuptime on_recv_rpl
        alias on_recv_rpl_statsoline on_recv_rpl
        alias on_recv_rpl_statshline on_recv_rpl
        alias on_recv_rpl_luserclient on_recv_rpl
        alias on_recv_rpl_luserop on_recv_rpl
        alias on_recv_rpl_luserunknown on_recv_rpl
        alias on_recv_rpl_luserchannels on_recv_rpl
        alias on_recv_rpl_luserme on_recv_rpl
        alias on_recv_rpl_adminme on_recv_rpl
        alias on_recv_rpl_adminloc1 on_recv_rpl
        alias on_recv_rpl_adminloc2 on_recv_rpl
        alias on_recv_rpl_adminemail on_recv_rpl
        alias on_recv_rpl_tracelog on_recv_rpl
        alias on_recv_rpl_none on_recv_rpl
        alias on_recv_rpl_away on_recv_rpl
        alias on_recv_rpl_userhost on_recv_rpl
        alias on_recv_rpl_ison on_recv_rpl
        alias on_recv_rpl_unaway on_recv_rpl
        alias on_recv_rpl_nowaway on_recv_rpl
        alias on_recv_rpl_whoisuser on_recv_rpl
        alias on_recv_rpl_whoisserver on_recv_rpl
        alias on_recv_rpl_whoisoperator on_recv_rpl
        alias on_recv_rpl_whowasuser on_recv_rpl
        alias on_recv_rpl_endofwho on_recv_rpl
        alias on_recv_rpl_whoisidle on_recv_rpl
        alias on_recv_rpl_endofwhois on_recv_rpl
        alias on_recv_rpl_whoischannels on_recv_rpl
        alias on_recv_rpl_liststart on_recv_rpl
        alias on_recv_rpl_list on_recv_rpl
        alias on_recv_rpl_listend on_recv_rpl
        alias on_recv_rpl_channelmodeis on_recv_rpl
        alias on_recv_rpl_notopic on_recv_rpl
        alias on_recv_rpl_topic on_recv_rpl
        alias on_recv_rpl_inviting on_recv_rpl
        alias on_recv_rpl_summoning on_recv_rpl
        alias on_recv_rpl_version on_recv_rpl
        alias on_recv_rpl_whoreply on_recv_rpl
        alias on_recv_rpl_namreply on_recv_rpl
        alias on_recv_rpl_links on_recv_rpl
        alias on_recv_rpl_endoflinks on_recv_rpl
        alias on_recv_rpl_endofname on_recv_rpl
        alias on_recv_rpl_banlist on_recv_rpl
        alias on_recv_rpl_endofbanlist on_recv_rpl
        alias on_recv_rpl_endofwhowas on_recv_rpl
        alias on_recv_rpl_info on_recv_rpl
        alias on_recv_rpl_motd on_recv_rpl
        alias on_recv_rpl_endofinfo on_recv_rpl
        alias on_recv_rpl_motdstart on_recv_rpl
        alias on_recv_rpl_endofmotd on_recv_rpl
        alias on_recv_rpl_youreoper on_recv_rpl
        alias on_recv_rpl_rehashing on_recv_rpl
        alias on_recv_rpl_time on_recv_rpl
        alias on_recv_rpl_users on_recv_rpl
        alias on_recv_rpl_endofusers on_recv_rpl
        alias on_recv_rpl_nousers on_recv_rpl

        alias on_recv_err on_recv
        alias on_recv_err_nosuchnick on_recv_err
        alias on_recv_err_nosuchserve on_recv_err
        alias on_recv_err_nosuchchannel on_recv_err
        alias on_recv_err_cannotsendtochan on_recv_err
        alias on_recv_err_toomanychannels on_recv_err
        alias on_recv_err_wasnosuchnick on_recv_err
        alias on_recv_err_toomanytargets on_recv_err
        alias on_recv_err_noorigin on_recv_err
        alias on_recv_err_norecipient on_recv_err
        alias on_recv_err_notexttosend on_recv_err
        alias on_recv_err_notopleve on_recv_err
        alias on_recv_err_wildtoplevel on_recv_err
        alias on_recv_err_unknowncommand on_recv_err
        alias on_recv_err_nomotd on_recv_err
        alias on_recv_err_noadmininfo on_recv_err
        alias on_recv_err_fileerror on_recv_err
        alias on_recv_err_nonicknamegiven on_recv_err
        alias on_recv_err_erroneusnickname on_recv_err
        alias on_recv_err_nicknameinuse on_recv_err
        alias on_recv_err_nickcollision on_recv_err
        alias on_recv_err_usernotinchannel on_recv_err
        alias on_recv_err_notonchanne on_recv_err
        alias on_recv_err_useronchannel on_recv_err
        alias on_recv_err_nologin on_recv_err
        alias on_recv_err_summondisabled on_recv_err
        alias on_recv_err_usersdisabled on_recv_err
        alias on_recv_err_notregistered on_recv_err
        alias on_recv_err_needmoreparam on_recv_err
        alias on_recv_err_alreadyregistre on_recv_err
        alias on_recv_err_nopermforhost on_recv_err
        alias on_recv_err_passwdmismatch on_recv_err
        alias on_recv_err_yourebannedcreep on_recv_err
        alias on_recv_err_keyset on_recv_err
        alias on_recv_err_channelisfull on_recv_err
        alias on_recv_err_unknownmode on_recv_err
        alias on_recv_err_inviteonlychan on_recv_err
        alias on_recv_err_bannedfromchan on_recv_err
        alias on_recv_err_badchannelkey on_recv_err
        alias on_recv_err_noprivileges on_recv_err
        alias on_recv_err_chanoprivsneeded on_recv_err
        alias on_recv_err_cantkillserver on_recv_err
        alias on_recv_err_nooperhost on_recv_err
        alias on_recv_err_umodeunknownflag on_recv_err
        alias on_recv_err_usersdontmatch on_recv_err
        
        alias on_recv_cmnd on_recv
        alias on_recv_cmnd_unknown on_recv_cmnd
        alias on_recv_cmnd_pass on_recv_cmnd
        alias on_recv_cmnd_nick on_recv_cmnd
        alias on_recv_cmnd_user on_recv_cmnd
        alias on_recv_cmnd_server on_recv_cmnd
        alias on_recv_cmnd_oper on_recv_cmnd
        alias on_recv_cmnd_quit on_recv_cmnd
        alias on_recv_cmnd_squit on_recv_cmnd
        alias on_recv_cmnd_join on_recv_cmnd
        alias on_recv_cmnd_part on_recv_cmnd
        alias on_recv_cmnd_mode on_recv_cmnd
        alias on_recv_cmnd_topic on_recv_cmnd
        alias on_recv_cmnd_names on_recv_cmnd
        alias on_recv_cmnd_list on_recv_cmnd
        alias on_recv_cmnd_invite on_recv_cmnd
        alias on_recv_cmnd_kick on_recv_cmnd
        alias on_recv_cmnd_version on_recv_cmnd
        alias on_recv_cmnd_statas on_recv_cmnd
        alias on_recv_cmnd_link on_recv_cmnd
        alias on_recv_cmnd_time on_recv_cmnd
        alias on_recv_cmnd_connect on_recv_cmnd
        alias on_recv_cmnd_trace on_recv_cmnd
        alias on_recv_cmnd_admin on_recv_cmnd
        alias on_recv_cmnd_info on_recv_cmnd
        alias on_recv_cmnd_privmsg on_recv_cmnd
        alias on_recv_cmnd_notice on_recv_cmnd
        alias on_recv_cmnd_who on_recv_cmnd
        alias on_recv_cmnd_whois on_recv_cmnd
        alias on_recv_cmnd_whowas on_recv_cmnd
        alias on_recv_cmnd_kill on_recv_cmnd
        alias on_recv_cmnd_ping on_recv_cmnd
        alias on_recv_cmnd_pong on_recv_cmnd
        alias on_recv_cmnd_error on_recv_cmnd
        alias on_recv_cmnd_away on_recv_cmnd
        alias on_recv_cmnd_rehash on_recv_cmnd
        alias on_recv_cmnd_restart on_recv_cmnd
        alias on_recv_cmnd_summon on_recv_cmnd
        alias on_recv_cmnd_users on_recv_cmnd
        alias on_recv_cmnd_wallops on_recv_cmnd
        alias on_recv_cmnd_userhost on_recv_cmnd
        alias on_recv_cmnd_ison on_recv_cmnd
        
        alias on_recv_cmnd_ctcp on_recv_cmnd
        alias on_recv_cmnd_ctcp_query on_recv_cmnd_ctcp
        alias on_recv_cmnd_ctcp_query_unknown on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_ping on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_echo on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_time on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_version on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_clientinfo on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_userinfo on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_action on_recv_cmnd_ctcp_query
        alias on_recv_cmnd_ctcp_query_dcc on_recv_cmnd_ctcp_query
        
        alias on_recv_cmnd_ctcp_answer on_recv_cmnd_ctcp
        alias on_recv_cmnd_ctcp_answer_unknown on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_ping on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_echo on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_time on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_version on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_clientinfo on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_userinfo on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_action on_recv_cmnd_ctcp_answer
        alias on_recv_cmnd_ctcp_answer_dcc on_recv_cmnd_ctcp_answer
    end

    ############################################################
    #
    # Irc protocol message class
    #
    class Message

        ########################################################
        #
        # constructer
        #
        # Args:
        #   message_string,[timestamp,selfNick,server]
        #
        # If Non-nil message_string is given, purse it.
        #  or message_string is nil, do nothing.
        #
        def initialize(msg,*option)
            @origin=msg
            
            @timestamp=option[0]
            @selfNick=option[1]
            @server=option[2]
            
            @from=nil
            @fromNick=nil
            @command=nil
            @cmndstr=nil
            @to=nil
            @args=Array.new
            
            @ctcpQuery=false
            @ctcpAnswer=false
            
            @add_info=nil

            parse(msg)
        end
        
        ########################################################
        #
        # instance variables
        #
        attr_reader :timestamp
        attr_reader :server
        attr_reader :selfNick
        attr_reader :from
        attr_reader :fromNick
        attr_reader :command
        attr_reader :cmndstr
        attr_reader :to
        attr_reader :args
        attr_reader :origin

        #
        # You may use add_info free to put addtional information.
        #
        attr_accessor :add_info
        
        ########################################################
        #
        # Is this message ctcp?
        #
        # Return:
        #   true|false
        #
        def isCtcp?
            return @ctcpQuery|@ctcpAnswer
        end
        
        ########################################################
        #
        # Is this message query (ctcp with PRIVMSG)?
        #
        # Return:
        #   true|false
        #
        def isCtcpQuery?
            return @ctcpQuery
        end

        
        ########################################################
        #
        # Is this message ctcp answer (ctcp with NOTICE)?
        #
        # Return:
        #   true|false
        #
        def isCtcpAnswer?
            return @ctcpAnswer
        end

        ########################################################
        #
        # Did I have published this message?
        #
        # Return:
        #   true|false
        #
        def isSelfMessage?
            if(@fromNick==@selfNick)
                return true
            else
                return false
            end
        end
        
        ########################################################
        #
        # Is this message only for me?
        #
        # Return:
        #   true|false
        #
        def isPriv?
            case @command
            when Event::RECV_CMND_PRIVMSG,Event::RECV_CMND_NOTICE
                #
                # Name which starts with '#','&' or '!' is channel name.
                #
                if(@to=~/^[\#\&\!].+/)
                    return false
                else
                    return true
                end
                
            else
                return false
            end
        end
        
        ########################################################
        #
        # Format as String
        #
        # Args:
        #   format_string,timestamp_format_string,kanji_code
        #
        # format_string:
        #     %T -> @timestamp : timestamp
        #     %n -> @selfNick  : self nick
        #     %s -> @server    : message published server
        #     %f -> @fromNick  : message from whom(nick)
        #     %F -> @from      : message from whom(full name)
        #     %c -> @command   : command (numeric)
        #     %C -> @cmndstr   : command (alphabetical)
        #     %t -> @to        : message to whom
        #     %a -> @args      : command arguments
        #     %o -> @origin    : original message
        #     Other charactors : as is
        #
        #     default : "%o"
        #
        # timestamp_format_string:
        #     same as Time.strftime()'s format
        #
        #     default : "%H:%M"
        #
        # kanji_code:
        #    "jis"|"euc"|"sjis"
        #
        #    default : "euc"
        #
        # Return:
        #   String
        #
        def string(*format)
            str=""
            tsformat=""
            kcode=""
            
            if(format.empty?)
                str="%o"
            else
                str=String(format[0])
                tsformat=String(format[1])
                kcode=String(format[2]).downcase
            end
            
            if(tsformat.empty?)
                tsformat="%H:%M"
            end
        
            str.gsub!("%T",@timestamp.strftime(tsformat))
            str.gsub!("%n",String(@selfNick))
            str.gsub!("%s",String(@server))
            str.gsub!("%f",String(@fromNick))
            str.gsub!("%F",String(@from))
            str.gsub!("%c",String(@command))
            str.gsub!("%C",String(@cmndstr))
            str.gsub!("%t",String(@to))
            if(@args.empty?)
                str.gsub!("%a","")
            else
                str.gsub!("%a",@args.join(" "))
            end
            str.gsub!("%o",@origin.to_s)
            
            case kcode
            when "jis"
                return Kconv::tojis(str)
            when "sjis"
                return Kconv::tosjis(str)
            else
                return str
            end
        end
        
        ########################################################
        #
        # parse Irc message to internal encoding
        #
        def parse(msg)
            if(String(msg).empty?)
                return
            end
            
            #
            # If there is no timestam, given them 
            #
            if(@timestamp.nil?)
                @timestamp=Time.now
            end
            
            #
            # Socket Event
            #
            if(msg.instance_of?(Fixnum))
                @command=msg
                @to=@selfNick
                @fromNick=@server
                @from=@fromNick

                case msg
                when Event::LINK_ESTABLISHING
                    @cmndstr="LINK_ESTABLISHING"
                when Event::LINK_ESTABLISHED
                    @cmndstr="LINK_ESTABLISHED"
                when Event::LINK_FAILED
                    @cmndstr="LINK_FAILED"
                when Event::LINK_CLOSING
                    @cmndstr="LINK_CLOSING"
                when Event::LINK_CLOSED
                    @cmndstr="LINK_CLOSED"
                end
                return
            end
            
            #
            # Some spetial messages parse
            #
            tmp=msg.split(" ",2)
            case tmp[0]
            when "KILL"
                @cmndstr="KILL"
                @command=Event::RECV_MESSAGE_KILL
                @args=[tmp[1]]
            when "PING"
                @cmndstr="PING"
                @command=Event::RECV_MESSAGE_PING
                @args=[tmp[1]]
            when "PONG"
                @cmndstr="PONG"
                @command=Event::RECV_MESSAGE_PONG
                @args=[tmp[1]]
            when "ERROR"
                @cmndstr="ERROR"
                @command=Event::RECV_MESSAGE_ERROR
                @args=[tmp[1]]
            when "NOTICE"
                #
                # for madoka-parsed CTCP message
                #
                # She parse unknown ctcp such as
                #   :hoge!~huga@hoe mohe PRIVMSG ^AGOHAN asa^A
                # to
                #   NOTICE mohe :GOHAN@hoge: asa
                #
                if(String(tmp[1])=~/([^\s]+) :([^\@\s]+)@([^:]+):(.+)/)
                    @ctcpQuery=true
                    @cmndstr="CTCP_QUERY"
                
                    @to=String($1)
                    @channel=@to
                    @fromNick=String($3)
                    @from=@fromNick
                    parseCtcp(Event::RECV_CMND+Event::CMND_CTCP_QUERY,
                              String($2)+String($4))
                else
                    @cmndstr="NOTICE"
                    @command=Event::RECV_MESSAGE_NOTICE
                    @args=[tmp[1]]
                end
            else
                parseMessage(msg)
            end
        end
        
        private
        
        ########################################################
        #
        # Irc Messages seems
        #   :from command to arg1 arg2 ... :last arg with space
        #
        def parseMessage(msg)
            
            #
            # get args
            #
            tmp=msg.sub(/^:/,"").sub(/ :/,"\n").split("\n")
            cmdar=tmp[0].split(" ")
            
            if(cmdar.size>3)
                @args=cmdar[3..-1]
                unless(tmp[1].nil?)
                    @args.push(tmp[1])
                end
            else
                @args=[tmp[1]]
            end
            
            #
            # get spoken by whom
            #
            if(cmdar[0]=~/(.+?)!.*/)
                @fromNick=$1
            else
                @fromNick=cmdar[0]
            end
            
            if(@fromNick.nil?)
                @command=Event::RECV_MESSAGE_BROKEN
                return
            end
            
            @fromNick.strip!
            @from=cmdar[0].downcase.strip
            
            #
            # get command or reply code
            #
            cmnd=cmdar[1].upcase.strip
            @cmndstr=cmnd
            
            @to=cmdar[2]
            unless(@to.nil?)
                @to.strip!
                if(@to.empty?)
                    @to=nil
                end
            end
            
            #
            # errors or system replys are seem non-0 integer
            #
            event=cmnd.to_i
            if(event==0)
                parseCommand(cmnd,@args)
            else
                @command=event
            end
        end
        
        ########################################################
        #
        # Irc command parse
        #   convert String to internal constant
        #
        def parseCommand(cmnd,arg)
            event=Event::RECV_CMND
            
            case(cmnd)
            when "PASS"
                event+=Event::CMND_PASS
            when "NICK"
                #
                # for madoka feed-back
                #
                if((@args[0].nil?)&&(!@to.nil?))
                    @args=[@to]
                else
                    @to=@args[0]
                end
                event+=Event::CMND_NICK
            when "USER"
                event+=Event::CMND_USER
            when "SERVER"
                event+=Event::CMND_SERVER
            when "OPER"
                event+=Event::CMND_OPER
            when "QUIT"
                event+=Event::CMND_QUIT
            when "SQUIT"
                event+=Event::CMND_SQUIT
            when "JOIN"
                #
                # for madoka feed-back
                #
                if((@args[0].nil?)&&(!@to.nil?))
                    @args=[@to]
                else
                    @to=@args[0]
                end
                event+=Event::CMND_JOIN
            when "PART"
                event+=Event::CMND_PART
            when "MODE"
                event+=Event::CMND_MODE
            when "TOPIC"
                event+=Event::CMND_TOPIC
            when "NAMES"
                event+=Event::CMND_NAMES
            when "LIST"
                event+=Event::CMND_LIST
            when "INVITE"
                event+=Event::CMND_INVITE
            when "KICK"
                event+=Event::CMND_KICK
            when "VERSION"
                event+=Event::CMND_VERSION
            when "STATAS"
                event+=Event::CMND_STATAS
            when "LINK"
                event+=Event::CMND_LINK
            when "TIME"
                event+=Event::CMND_TIME
            when "CONNECT"
                event+=Event::CMND_CONNECT
            when "TRACE"
                event+=Event::CMND_TRACE
            when "ADMIN"
                event+=Event::CMND_ADMIN
            when "INFO"
                event+=Event::CMND_INFO
            when "PRIVMSG"
                begin
                    if(args[0][0]==1)
                        @ctcpQuery=true
                        @cmndstr="CTCP_QUERY"
                        parseCtcp(event+Event::CMND_CTCP_QUERY,arg.join(" "))
                        return
                    end
                rescue NameError
                end
                event+=Event::CMND_PRIVMSG
            when "NOTICE"
                begin
                    if(args[0][0]==1)
                        @ctcpAnswer=true
                        @cmndstr="CTCP_ANSWER"
                        parseCtcp(event+Event::CMND_CTCP_ANSWER,args.join(" "))
                        return
                    end
                rescue NameError
                end
                event+=Event::CMND_NOTICE
            when "WHO"
                event+=Event::CMND_WHO
            when "WHOIS"
                event+=Event::CMND_WHOIS
            when "WHOWAS"
                event+=Event::CMND_WHOWAS
            when "KILL"
                event+=Event::CMND_KILL
            when "PING"
                event+=Event::CMND_PING
            when "PONG"
                event+=Event::CMND_PONG
            when "ERROR"
                event+=Event::CMND_ERROR
            when "AWAY"
                event+=Event::CMND_AWAY
            when "REHASH"
                event+=Event::CMND_REHASH
            when "RESTART"
                event+=Event::CMND_RESTART
            when "SUMMON"
                event+=Event::CMND_SUMMON
            when "USERS"
                event+=Event::CMND_USERS
            when "WALLOPS"
                event+=Event::CMND_WALLOPS
            when "USERHOST"
                event+=Event::CMND_USERHOST
            when "ISON"
                event+=Event::CMND_ISON
            end
            
            @command=event
        end
        
        ########################################################
        #
        # Ctcp message parse
        #
        # Handlabel ctcp commands are follow as:
        #  PING, ECHO, TIME, VERSION, CLIENTINFO, USERINFO
        #
        def parseCtcp(event,arg)
            if(arg.nil?)
                @command=event
                return
            end
            
            cmnd=nil
            arg.gsub!(1.chr,"")
            tmp=arg.split(" ",2)
            if(tmp[0].nil?)
                @command=event
                return
            else
                cmnd=String(tmp[0]).upcase
                @args=[String(tmp[1]).strip]
            end
            
            @cmndstr+="_"+cmnd
            
            case(cmnd)
            when "PING"
                event+=Event::CMND_CTCP_PING
            when "ECHO"
                event+=Event::CMND_CTCP_ECHO
            when "TIME"
                event+=Event::CMND_CTCP_TIME
            when "VERSION"
                event+=Event::CMND_CTCP_VERSION
            when "CLIENTINFO"
                event+=Event::CMND_CTCP_CLIENTINFO
            when "USERINFO"
                event+=Event::CMND_CTCP_USERINFO
            when "ACTION"
                event+=Event::CMND_CTCP_ACTION
            when "DCC"
                event+=Event::CMND_CTCP_DCC
            else
                #
            end
            
            @command=event
        end
        
    end
    
    
    ############################################################
    #
    # TCPSocket wrapper
    #
    # This class establishs connection to Irc server.
    #
    # When this class gets event from socket, that will notice
    # to observers update() method. 
    #
    # When Observer recieve Event::RECV_MESSAGE, MUST CALL
    # this class's read method.
    #
    # Event format as follow:
    #   event_code, timestamp, nick, server
    #
    class Connector
        include Observable
        
        WRITE_PRIORITY_HIGH=0
        WRITE_PRIORITY_DEFAULT=1
        WRITE_PRIORITY_LOW=3
        WRITE_PRIORITY_NONE=-1
        
        ########################################################
        #
        # constructer
        #
        # Args:
        #   serverinfo,userinfo,nick,kanji_code
        #
        #   serverinfo:
        #     servername|[servername,port,passwd,serveralias]
        #
        #     default:
        #       port   : 6667
        #       passwd : ""
        #       serveralias : same as servername
        #
        #   userinfo:
        #     username|[username,realname]
        #
        #     default:
        #       realname=username
        #
        #   kanji_code:
        #     "euc"|"jis"|"sjis"|"none"
        #
        #     default="jis"
        #
        def initialize(serverinfo,userinfo,nick,kcode="jis")
            
            #
            # set server information
            #

            if(serverinfo.instance_of?(Array))
                @server=String(serverinfo[0])
                @port=serverinfo[1].to_i
                if(@port==0)
                    @port=6667
                end
                @passwd=serverinfo[2]
                @serveralias=serverinfo[3]
                if(@serveralias.to_s.empty?)
                    @serveralias=@server
                end
            else
                @server=String(serverinfo)
                @port=6667
                @passwd=""
                @serveralias=@server
            end

            #
            # set user information
            #
            if(userinfo.instance_of?(Array))
                @user=String(userinfo[0])
                @realname=String(userinfo[1])
            else
                @user=String(userinfo)
                @realname=@user
            end
            
            @nick=nick
            
            #
            # set output kanji code
            #
            @kcode=kcode.to_s.downcase
            
            @mutex=Mutex.new
            @socket=nil
            @recvthread=nil
            @recvmsg=Queue.new
            
            @sendthreads=Hash.new
            @sendqueue={WRITE_PRIORITY_HIGH => Queue.new,
                WRITE_PRIORITY_DEFAULT => Queue.new,
                WRITE_PRIORITY_LOW => Queue.new}
            
            @stat=nil
        end
        
        public
        attr_reader :server
        attr_reader :port
        attr_reader :passwd
        attr_reader :serveralias
        attr_reader :user
        attr_reader :realname
        attr_accessor :nick
        
        attr_reader :stat
        attr_accessor :kcode
        
        ########################################################
        #
        # socket open and start reading, writing threads
        #
        # Return:
        #   true (succeed)|false (failed)
        #
        # Event:
        #   Event::LINK_ESTABLISHED (successed)
        #   Event::LINK_FAILED (failed)
        #
        def open
            if(self.alive?)
                return false
            end
            
            @stat=Event::LINK_ESTABLISHING
            begin
                @socket=TCPsocket::open(@server,@port)
            rescue StandardError,SocketError
                @stat=Event::LINK_FAILED
                notify(@stat)
                return false
            end
            
            #
            # start thread for reading
            #
            @recvthread=Thread.start do
                readfromsocket
            end
            
            #
            # start three threads for writing
            #  (for pong message, for normal message, for ctcp message)
            #
            for i in [WRITE_PRIORITY_HIGH,
                    WRITE_PRIORITY_DEFAULT,
                    WRITE_PRIORITY_LOW]
                @sendthreads[i]=Thread.start do
                    writetosocket(i)
                end
            end
            
            @stat=Event::LINK_ESTABLISHED
            notify(@stat)
            return true
        end

        ########################################################
        #
        # socket close and stop all threads
        #
        # Event:
        #   Event::LINK_CLOSED
        #
        def close
            @stat=Event::LINK_CLOSING
            
            #
            # stop thread for reading
            #
            unless(@recvthread.nil?)
                if(@recvthread.alive?)
                    @recvthread.exit
                end
            end
            
            #
            # stop threads for writing
            #
            @sendthreads.each_value{|t|
                unless(t.nil?)
                    if(t.alive?)
                        t.exit
                    end
                end
            }
            
            #
            # close socket
            #
            unless(@socket.closed?)
                @socket.close
            end
            
            @stat=Event::LINK_CLOSED
            notify(@stat)
        end
        
        ########################################################
        #
        # Am I alive?
        #
        # Return:
        #   true (alive)|false (dead)
        #
        # Any threads are dead or socket is closed, asumed dead
        #
        def alive?
            unless(@recvthread.instance_of?(Thread))
                return false
            end
            
            ret=@recvthread.alive?
            @sendthreads.each_value{|t|
                ret&=t
            }
            ret&=(!@socket.closed?)
            
            return ret
        end
        
        ########################################################
        #
        # write message to server
        #
        # Args
        #   msg: message to write
        #   options: [priority,echoback]
        #     priority:
        #       WRITE_PRIORITY_HIGH|WRITE_PRIORITY_LOW
        #                |WRITE_PRIORITY_DEFAULT|WRITE_PRIORITY_NONE
        #     echoback:
        #       true|false
        #     
        #   default options value
        #     priority: WRITE_PRIORITY_DEFAULT
        #     echoback: false
        #     
        def write(msg,*option)
            
            #
            # remove cr/lf from string and add cr to end of string
            #
            msg=msg.gsub(/[\r\n]/,"")+"\n"
            
            #
            # kanji code conversion
            #
            case @kcode
            when "euc"
                msg=Kconv::toeuc(msg)
            when "jis"
                msg=Kconv::tojis(msg)
            when "sjis"
                msg=Kconv::tosjis(msg)
            else
                #
            end
            
            #
            # parse options
            #
            priority=WRITE_PRIORITY_DEFAULT
            echoback=false
            option.each{|opt|
                if(opt.instance_of?(TrueClass))
                    echoback=true
                else
                    case opt
                    when WRITE_PRIORITY_HIGH
                        priority=WRITE_PRIORITY_HIGH
                    when WRITE_PRIORITY_LOW
                        priority=WRITE_PRIORITY_LOW
                    when WRITE_PRIORITY_NONE
                        priority=WRITE_PRIORITY_NONE
                    end
                end
            }
            
            #
            # write string to queue
            #
            case priority
            when WRITE_PRIORITY_NONE
                # nop
            when WRITE_PRIORITY_HIGH
                @sendqueue[WRITE_PRIORITY_HIGH].push(msg)
            when WRITE_PRIORITY_LOW
                @sendqueue[WRITE_PRIORITY_LOW].push(msg)
            else
                @sendqueue[WRITE_PRIORITY_DEFAULT].push(msg)
            end
            
            #
            # Follow echoback method lacks elegant,
            #  but I have no idea about other way.
            #
            if(echoback)
                queueingWithNotify(":"+@nick+" "+msg)
            end
        end
        
        ########################################################
        #
        # read from queue
        #
        # Return:
        #   String
        #
        def read
            return irc_to_kcode(@recvmsg.pop)
        end
        
        private
        
        ########################################################
        #
        # IRCの文字コードを$KCODEに変換
        #
        def irc_to_kcode(s)
            return s
            #s= s.gsub(/\e\(J/n, "\e(I").unpack("C*").map(){ |c| (c & 0x7f) }.pack("C*")
            #    #cottonの半角カナをNKFがサポートする半角カナに変換。
            #return NKF.nkf("-eJx", s) #半角カナを保ってEUCに変換。
        end
        
        ########################################################
        #
        # notify_observers wrapper
        #
        def notify(event)
            changed
            notify_observers(event,Time.now,@nick,@serveralias)
        end
        
        ########################################################
        #
        # TCPSocket.read wrapper
        #
        # Event:
        #   RECV_MESSAGE
        #
        # Strings which get form socket is put to queue.
        #
        def readfromsocket
            loop do
                if(@socket.eof?)
                    break
                else
                    begin
                        queueingWithNotify(@socket.gets)
                    rescue StandardError,SocketError,IOError
                        break
                    end
                end
            end
            
            @recvthread=nil
            self.close
            Thread.current.exit
        end

        ########################################################
        #
        # TCPSocket.write wrapper
        #
        # read one message from queue, and write to socket
        #
        def writetosocket(priority)
            loop do
                mes=@sendqueue[priority].pop
                begin
                    @socket.write(mes)
                rescue StandardError,SocketError,IOError
                    break
                end
                sleep(priority)
            end
            
            @sendthreads[priority]=nil
            self.close
            Thread.current.exit
        end
        
        ########################################################
        #
        # queueing and notifing
        #
        def queueingWithNotify(str)
            unless(str.nil?)
                str.gsub!(/[\r\n]+/,"")
                @recvmsg.push(str)
                changed
                notify(Event::RECV_MESSAGE)
            end
        end
    end
    
    
    ############################################################
    #
    # Irc connection management class
    #
    # This class is relaying between each Connectors to 
    # the Message Distributer.
    #
    class ConnectionManager
        include Observable
        include Singleton
        
        ########################################################
        #
        # constructer
        #
        def initialize
            @connectors=Hash.new
            @quited=Array.new
            @msgQueue=Queue.new
            @eventQueue=Queue.new
            @mutex=Mutex.new
            @thread=Thread.start do
                issueEvent
            end
        end
        
        attr_reader :connectors
        
        ########################################################
        #
        # event reciever
        #
        # all events are forwarded to the Message Distributer. 
        #
        def update(event,timestamp,nick,server)

            @mutex.lock
            case event
            when Event::LINK_CLOSED,Event::LINK_FAILED
                
                #
                # When link close or failed, remove server from table
                #
                if(@quited.include?(server))
                    @connectors.delete(server)
                    @connectors.rehash
                    @quited.delete(server)
                end
                
            when Event::RECV_MESSAGE
                
                #
                # get one message from server and forward
                #
                if(@connectors.has_key?(server))
                    msg=@connectors[server].read
                    unless(msg.nil?)
                        @msgQueue.push(msg)
                    end
                end
            end

            #
            # call MessageDistributer#update NOT directory,
            # but gather to one thread.
            #
            @eventQueue.push([event,timestamp,nick,server])

            @mutex.unlock
        end
        
        ########################################################
        #
        # Connector::open() wrapper
        #
        # Return:
        #   true(succeed)|failse(falied)|nil(already open)
        #
        def open(serverinfo,userinfo,nick,kcode="jis")

            #
            # get server name
            #
            unless(serverinfo.instance_of?(Array))
                serverinfo=[String(serverinfo),6667,"",String(serverinfo)]
            end
            server=serverinfo[3]
            if(server.to_s.empty?)
                server=serverinfo[0]
            end

            unless(@connectors.has_key?(server))
                #
                # create Connector, regist to table of connector's,
                # and be Connector's observer.
                #
                @connectors[server]=
                    Connector.new(serverinfo,userinfo,nick,kcode)
                @connectors[server].add_observer(self)
            end

            return @connectors[server].open
        end
        
        ########################################################
        #
        # Connector::close() wrapper
        #
        # Args:
        #   server
        #
        # If server is nil, close all connections.
        #
        def close(server,purge=false)
            if(server.nil?)
                if(purge)
                    @connectors.each_key{|s|
                        @quited.push(s)
                    }
                end
                @connectors.each_value{|conn|
                    conn.close
                }
            else
                unless(server.instance_of?(Array))
                    server=[String(server)]
                end
                if(purge)
                    server.each{|s|
                        @quited.push(s)
                    }
                end
                server.each{|s|
                    if(@connectors.has_key?(s))
                        @connectors[s].close
                    end
                }
            end
        end
        
        ########################################################
        #
        # Reopen connections
        #
        # Return:
        #   true(succeed)|failse(falied)|nil(already open or purged)
        #
        def reopen(server)
            unless(@connectors.has_key?(server))
                return nil
            end
            
            return @connectors[server].open
        end
        
        ########################################################
        #
        # Close all connections
        #
        def closeAll(purge=false)
            self.close(nil,purge)
        end
        
        ########################################################
        #
        # Iterator
        #
        def eachConnector
            for i in @connector
                yield(i)
            end
        end
        
        ########################################################
        #
        # Delegator
        #
        def [](server)
            return @connectors[server]
        end
        
        ########################################################
        #
        # Is connection alive?
        #
        def alive?(server)
            if(@connectors.has_key?(server))
                return @connectors[server].alive?
            else
                return false
            end
        end
        
        ########################################################
        #
        # Listing connection
        #
        # Return:
        #   Array of server name
        #
        def connections
            return @connectors.keys
        end
        
        ########################################################
        #
        # Set server's nick
        #
        # Return:
        #   Array of server name
        #
        def setNick(server,nick)
            if(@connectors.has_key?(server))
                @connectors[server].nick=nick
            end
        end
        
        ########################################################
        #
        # Connector::write() wrapper
        #
        # Args:
        #   server,message,[priority,echoback]
        #
        # If server is nil, write to all connections.
        #
        def write(server,msg,*option)
            if(server.nil?)
                @connectors.each_value{|conn|
                    conn.write(msg,*option)
                }
            else
                unless(server.instance_of?(Array))
                    server=[String(server)]
                end
                server.each{|s|
                    if(@connectors.has_key?(s))
                        @connectors[s].write(msg,*option)
                    end
                }
            end
        end
        
        ########################################################
        #
        # write to all connections
        #
        def writeAll(msg,*option)
            self.write(nil,msg,*option)
        end
        
        ########################################################
        #
        # IrcConnection.read() wrapper
        #
        def read
            return @msgQueue.pop
        end
        
        private
        
        ########################################################
        #
        # event messages are gathered and issued only from here.
        #
        def issueEvent
            loop do
                event=@eventQueue.pop
                changed
                notify_observers(event[0],event[1],event[2],event[3])
            end
        end
    end
    
    
    ############################################################
    #
    # Message Distributior class
    #
    # This class makes Irc message capcellized, distribute that from
    # the connection manager to each Message processors, and command
    # which is published by each Message processor to the connection
    # manager.
    #
    # And more, server login process, PING-PONG process and server
    # nick management process are handled at here.
    #
    #
    class MessageDistributor
        include Observable
        include Singleton
        
        ########################################################
        #
        # constructer
        #
        # be ConnectionManager's observer
        #
        def initialize
            @connector=ConnectionManager.instance
            @connector.add_observer(self)
        end
        
        ########################################################
        #
        # event recievor
        #
        # All evetns are forward to each Message Processors with
        # Message.
        #
        def update(event,timestamp,nick,server)
            case event
            when Event::LINK_ESTABLISHED
                #
                # when connect to server, do login
                #
                login(server)
                changed
                notify_observers(Message.new(event,
                                             timestamp,nick,server))
                
            when Event::LINK_CLOSED,Event::LINK_FAILED
                changed
                notify_observers(Message.new(event,
                                             timestamp,nick,server))
                
            when Event::RECV_MESSAGE

                #
                # message capcellized
                #
                msg=Message.new(@connector.read,
                                timestamp,nick,server)
                #
                # handle some message
                #
                if(process(msg))
                    changed
                    notify_observers(msg)
                end
            end
        end
        
        ########################################################
        #
        # ConnectionManager::open() wrapper
        #
        def open(serverinfo,userinfo,nick,kcode="jis")
            @connector.open(serverinfo,userinfo,nick,kcode)
        end
        
        ########################################################
        #
        # ConnectionManager::reopen() wrapper
        #
        def reopen(server)
            @connector.reopen(server)
        end
        
        ########################################################
        #
        # ConnectionManager::close() wrapper
        #
        #   The connection information are purged.
        #
        def close(server,purge=true)
            if(purge)
                #
                # If connention is active, do logout before close.
                #
                if(@connector.alive?(server))
                    self.cmnd_quit(server)
                end
            end
            
            @connector.close(server,purge)
        end
        
        ########################################################
        #
        # close all connection
        #
        def closeAll(purge=true)
            @connector.connections.each{|conn|
                self.close(conn,purge)
            }
        end
        
        ########################################################
        #
        # ConnectionManager::connection wrapper
        #
        def connections
            return @connector.connections
        end
        
        ########################################################
        #
        # command publish helpers
        #
        
        def cmnd_pass(server,passwd)
            @connector.write(server,"pass "+passwd,
                             Connector::WRITE_PRIORITY_HIGH)
        end
        
        def cmnd_nick(server,nickname)
            @connector.write(server,"nick "+nickname)
        end
        
        def cmnd_user(server,username,realname)
            @connector.write(server,
                             "user "+username.downcase+" * * :"+realname,
                             Connector::WRITE_PRIORITY_HIGH)
        end
        
        def cmnd_server(server)
            #not impriment
        end
        
        def cmnd_oper(server)
            #not impriment
        end
        
        def cmnd_quit(server,*msg)
            if(msg.empty?)
                @connector.write(server,"quit",true)
            else
                @connector.write(server,"quit :"+String(msg[0]),true)
            end
        end
        
        def cmnd_squit(server)
            #not impriment
        end
        
        def cmnd_join(server,chnl,*key)
            if(key.empty?)
                @connector.write(server,"join "+chnl)
            else
                @connector.write(server,"join "+chnl+" "+key.join(","))
            end
        end
        
        def cmnd_part(server,chnl,*msg)
            if(msg.empty?)
                @connector.write(server,"part "+chnl)
            else
                @connector.write(server,"part "+chnl+" :"+String(msg[0]))
            end
        end
        
        def cmnd_mode(server,chnl,*arg)
            if(arg.empty?)
                @connector.write(server,"mode "+chnl)
            else
                @connector.write(server,"mode "+chnl+" :"+arg.join(" "))
            end
        end
        
        def cmnd_topic(server,chnl,*arg)
            if(arg.empty?)
                @connector.write(server,"topic "+chnl)
            else
                @connector.write(server,"topic "+chnl+" :"+String(arg[0]))
            end
        end
        
        def cmnd_names(server,*chnl)
            if(chnl.empty?)
                @connector.write(server,"names")
            else
                @connector.write(server,"names "+String(chnl[0]))
            end
        end
        
        def cmnd_list(server)
            #not impriment
        end
        
        def cmnd_invite(server,chnl,nickname)
            @connector.write(server,"invite "+nickname+" "+chnl)
        end
        
        def cmnd_kick(server,chnl,nickname,*reason)
            if(reason.empty?)
                @connector.write(server,"kick "+chnl+" "+nickname)
            else
                @connector.write(server,
                                 "kick "+chnl+" "+nickname+" :"+
                                 String(reason[0]))
            end
        end
        
        def cmnd_version(server)
            #not impriment
        end
        
        def cmnd_statas(server)
            #not impriment
        end
        
        def cmnd_link(server)
            #not impriment
        end
        
        def cmnd_time(server)
            #not impriment
        end
        
        def cmnd_connect(server)
            #not impriment
        end
        
        def cmnd_trace(server)
            #not impriment
        end
        
        def cmnd_admin(server)
            #not impriment
        end
        
        def cmnd_info(server)
            #not impriment
        end
        
        def cmnd_privmsg(server,to,msg)
            limit=RICA_PRIVMSG_MAX_LEN-(to.size+10)
            autofill(msg,limit).each{|str|
                @connector.write(server,"privmsg "+to+" :"+str,true)
            }
        end
        
        def cmnd_notice(server,to,msg)
            limit=RICA_PRIVMSG_MAX_LEN-(to.size+9)
            autofill(msg,limit).each{|str|
                @connector.write(server,"notice "+to+" :"+str,true)
            }
        end
        
        def cmnd_who(server,nickname)
            @connector.write(server,"who "+nickname)
        end
        
        def cmnd_whois(server,nickname)
            @connector.write(server,"whois "+nickname)
        end
        
        def cmnd_whowas(server,nickname)
            @connector.write(server,"whowas "+nickname)
        end
        
        def cmnd_kill(server)
            #not impriment
        end
        
        def cmnd_ping(server,arg)
            @connector.write(server,"ping "+arg,
                             Connector::WRITE_PRIORITY_HIGH)
        end
        
        def cmnd_pong(server,arg)
            @connector.write(server,"pong "+arg,
                             Connector::WRITE_PRIORITY_HIGH)
        end

        def cmnd_error(server)
            #not impriment
        end
        
        def cmnd_away(server,*msg)
            if(msg.empty?)
                @connector.write(server,"away")
            else
                @connector.write(server,"away :"+String(msg[0]))
            end
        end
        
        def cmnd_rehash(server)
            #not impriment
        end
        
        def cmnd_restart(server)
            #not impriment
        end
        
        def cmnd_summon(server)
            #not impriment
        end
        
        def cmnd_users(server)
            #not impriment
        end
        
        def cmnd_wallops(server)
            #not impriment
        end
        
        def cmnd_userhost(server)
            #not impriment
        end
        
        def cmnd_ison(server,nickname)
            @connector.write(server,"ison "+nickname)
        end
        
        def ctcp_query(server,to,msg)
            @connector.write(server,"privmsg "+to+" :"+1.chr+msg+1.chr,
                             Connector::WRITE_PRIORITY_LOW)
        end
        
        def ctcp_answer(server,to,msg)
            @connector.write(server,"notice "+to+" :"+1.chr+msg+1.chr,
                             Connector::WRITE_PRIORITY_LOW)
        end
        
        def ctcp_query_ping(server,to)
            ctcp_query(server,to,"PING "+String(Time.now.tv_sec))
        end
        
        def ctcp_query_echo(server,to,str)
            ctcp_query(server,to,"ECHO "+str)
        end
        
        def ctcp_query_time(server,to)
            ctcp_query(server,to,"TIME")
        end
        
        def ctcp_query_version(server,to)
            ctcp_query(server,to,"VERSION")
        end
        
        def ctcp_query_clientinfo(server,to,*option)
            if(option.empty?)
                ctcp_query(server,to,"CLIENTINFO")
            else
                ctcp_query(server,to,"CLIENTINFO "+String(option[0]))
            end
        end
        
        def ctcp_query_userinfo(server,to)
            ctcp_query(server,to,"USERINFO")
        end
        
        def ctcp_answer_ping(server,to,arg)
            ctcp_answer(server,to,"PING "+arg)
        end
        
        def ctcp_answer_echo(server,to,arg)
            ctcp_answer(server,to,"ECHO "+arg)
        end
        
        def ctcp_answer_time(server,to)
            ctcp_answer(server,to,"TIME "+String(Time.now.localtime))
        end
        
        def ctcp_answer_version(server,to,arg)
            ctcp_answer(server,to,"VERSION "+arg)
        end
        
        def ctcp_answer_clientinfo(server,to,msg)
            ctcp_answer(server,to,"CLIENTINFO "+msg)
        end
        
        def ctcp_answer_userinfo(server,to,msg)
            if(msg.instance_of?(String))
                msg=msg.split("\n")
            end
            if(msg.instance_of?(Array))
                msg.each{|m|
                    ctcp_answer(server,to,"USERINFO :"+m)
                }
            end
        end
        
        ########################################################
        #
        # direct command publish
        #
        # If command is "QUIT", "PRIVMSG" or "NOTICE", and it's not 
        # CTCP published message is been echoback.
        #
        def directcommand(server,msg)
            tmp=nil
            if(msg[0]==":")
                tmp=Message.new(msg)
            else
                tmp=Message.new(":* "+msg)
            end
            
            case tmp.command
            when Event::RECV_CMND_QUIT,
                    Event::RECV_CMND_PRIVMSG,Event::RECV_CMND_NOTICE
                @connector.write(server,msg,true)
            else
                @connector.write(server,msg)
            end
        end
        
        ########################################################
        #
        # talkback
        #
        # Message does NOT send to server, but only distributes 
        # to each Message processor.
        #
        def talkback(server,msg)
            @connector.write(server,msg,true,
                             Connector::WRITE_PRIORITY_NONE)
        end
        
        ########################################################
        #
        # some procs
        #
        def login(server)
            conn=nil
            if(@connector.alive?(server))
                conn=@connector[server]
            else
                return
            end
            
            unless(conn.passwd.empty?)
                self.cmnd_pass(server,conn.passwd)
            end
            self.cmnd_user(server,conn.user.downcase,conn.realname)
            self.cmnd_nick(server,conn.nick)
        end
        
        def setAway(server,msg)
            self.cmnd_away(server,msg)
        end
        
        def unsetAway(server)
            self.cmnd_away(server)
        end
        
        def getTopic(server,chnl)
            self.cmnd_topic(server,chnl)
        end
        
        def setTopic(server,chnl,str)
            self.cmnd_topic(server,chnl,str)
        end
        
        def getMode(server,chnl)
            self.cmnd_mode(server,chnl)
        end
        
        def setMode(server,chnl,str)
            self.cmnd_mode(server,chnl,str)
        end
        
        ########################################################
        #
        # Override Observerable Module to apply Thread
        #
        def add_observer(observer)
            super
            
            @observer_queues = {} unless defined? @observer_queues
            @observer_queues[observer]=Queue.new
            
            @observer_threads = {} unless defined? @observer_threads
            @observer_threads[observer]=Thread.new(observer){
                loop do
                    arg=@observer_queues[observer].pop
                    observer.update(*arg)
                end
            }
        end
        def delete_observer(observer)
            if defined? @observer_threads
                if(@observer_threads.has_key?(observer))
                    @observer_threads[observer].kill
                    @observer_threads.delete(observer)
                end
            end
            @observer_queues.delete(observer) if defined? @observer_queues
            
            super
        end
        def delete_observers
            if(@observer_threads.defined?)
                @observer_threads.each_value{|t|
                    t.kill
                }
                @observer_threads[observer].clear
            end
            @observer_queues.clear if defined? @observer_queues
            
            super
        end
        def notify_observers(*arg)
            if defined? @observer_state and @observer_state
                if defined? @observer_peers
                    for i in @observer_peers.dup
                        @observer_queues[i].push(arg.to_a)
                    end
                end
                @observer_state = false
            end
        end
        def observer_thread(observer)
            if defined? @observer_threads
                return @observer_threads[observer]
            else
                return nil
            end
        end
        
        private
        
        ########################################################
        #
        # Error handling, PING-PONG, server nick management
        #
        # Return:
        #   true (event is forwarded)|false (event is NOT forwarded)
        #
        def process(msg)
            ret=true
            
            case msg.command
            when Event::RECV_MESSAGE_KILL
                @connector.close(msg.server)
            when Event::RECV_MESSAGE_PING
                self.cmnd_pong(msg.server,msg.args[0])
                ret=false
            when Event::RECV_MESSAGE_PONG
                ret=false
            when Event::RECV_MESSAGE_ERROR
                @connector.close(msg.server)
            when Event::RECV_RPL_INIT,Event::RECV_RPL_MOTDSTART
                @connector.setNick(msg.server,msg.to)
            when Event::RECV_CMND_NICK
                if(msg.isSelfMessage?)
                    @connector.setNick(msg.server,msg.args[0].strip)
                end
            when Event::RECV_CMND_QUIT
                if(msg.isSelfMessage?)
                    @connector.close(msg.server,true)
                end
            else
                #
            end
            
            return ret
        end

        ########################################################
        #
        # strings auto-fill
        # 
        # Args:
        #   str   : strings
        #   limit : fill length
        #
        # Return:
        #   lines   : matrix of each line   
        #
        def autofill(str,limit)
            lines=[]
            thisline=str.dup.to_s

            until(thisline.empty?) do
                #
                # line break with multi-byte charactor supporting
                #
                while(thisline.size>limit)
                    thisline.chop!
                end
                if(thisline==str)
                    str=""
                else
                    str=str[thisline.size..-1].to_s
                end

                if(str.empty?)
                    lines.push(thisline)
                    thisline=str.dup.to_s
                else
                    #
                    # If there is a white space, break at there. 
                    #
                    tmp=thisline.reverse.split(/\s/,2)
                    unless(tmp[1].to_s.empty?)
                        lines.push(tmp[1].reverse)
                        thisline=" "+tmp[0].reverse+str.dup.to_s
                    else
                        lines.push(tmp[0].reverse)
                        thisline=str.dup.to_s
                    end
                end
            end

            return lines
        end
    end
    
    
    ############################################################
    #
    # message process class template.
    #
    # This class is forwarded methods and Message from
    # MessageDistributor.
    # So, you can access his all methods as those were at this
    # class.
    #
    # To create your original front-end or agents(eg. bot), it's
    # easy way that you create sub-class inheriting this class.
    #
    class MessageProcessor<SimpleDelegator
        include Event
        
        ########################################################
        #
        # constructor
        #
        # be MessageDistributor's observor and delegetor
        #
        def initialize
            @conn=MessageDistributor.instance
            @conn.add_observer(self)
            super(@conn)
        end
        
        ########################################################
        #
        # get self thread
        #
        # Return:
        #   Thread
        #
        def thread
            return @conn.observer_thread(self)
        end

        def update(msg)
            dispatch(msg)
        end

        def dispatch(msg)
            super
        end
    end
end
