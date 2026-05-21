var messages  = {
      en: {
        translation: {
          label: {
            app: "App",
            run: "Run",
            app_name: "Drive Auto Nav",
            top_bar: "Drive Auto Nav",
            first_start : "Start",
            refresh_start : "Refresh",
            after_second: "executed after seconds",
            status_app_enable : 'The action is [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">enabled</span></span>].',
            status_app_disable : 'The action is [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">disabled</span></span>].',
            status_stop:'Execute when charging [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">Stop</span></span>]. ',
            status_start:'Execute when charging [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">start</span></span>]. ',
            status_bluetooth_stop:'Executed when connected to Bluetooth [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">stopped</span></span>].',
            status_bluetooth_start:'Executed when connected to Bluetooth [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">started</span></span>]. ',
            status_wifi_stop:'Executed when connected to WIFI [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">stopped</span></span>].',
            status_wifi_start:'Executed when connected to WIFI [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">started</span></span>]. ',
            status_exclude_run_on_screen_start : 'Run on screen [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">not</span></span>].',
            status_exclude_run_on_screen_stop : '<strike>Run on screen [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">not</span></span>].</strike>',
            status_run_speed_start : '<b>Run</span> when reaching <span style="color:var(--softm-start);font-weight:bold">{runSpeedLimit}</span> km/h within <span style="color:var(--softm-start);font-weight:bold">{runSpeedLimitTime}</span> minutes. [<span style="color:var(--softm-start);font-weight:bold">On</span>].</b>',
            status_run_speed_stop : '<del><span style="color:var(--softm-start);font-weight:bold">Run</span> when reaching <span style="color:var(--softm-start);font-weight:bold">{runSpeedLimit}</span>km/h within <span style="color:var(--softm-start);font-weight:bold">{runSpeedLimitTime}</span> minutes. [<span style="color:var(--softm-stop);font-weight:bold">Off</span>].</del>',
            status_geofence_start : '<b><span style="color:var(--softm-start);font-weight:bold">When entering within {radiusMeter}</span>, <span style="color:var(--softm-start);font-weight:bold">It will operate</span>. [<span style="color:var(--softm-start);font-weight:bold">On</span>].</b>',
            status_geofence_stop : '<del><span style="color:var(--softm-start);font-weight:bold">When entering within {radiusMeter}</span>, <span style="color:var(--softm-start);font-weight:bold">It will operate</span>. [<span style="color:var(--softm-start);font-weight:bold">Off</span>].</del>',
            status_run_status_on_screen_start : '<b>Run with the screen on <span style="color:var(--softm-start);font-weight:bold">on</span> [<span style="color:var(--softm-start);font-weight:bold">on</span>].</b>',
            status_run_status_on_screen_stop : '<del>Run with the screen on <span style="color:var(--softm-start);font-weight:bold">on</span> [<span style="color:var(--softm-stop);font-weight:bold">off</span>].</del>',
            status_run_status_off_screen_start : '<b>Run with the screen off <span style="color:var(--softm-start);font-weight:bold">on</span> [<span style="color:var(--softm-start);font-weight:bold">on</span>].</b>',
            status_run_status_off_screen_stop : '<del>Run with screen off <span style="color:var(--softm-start);font-weight:bold">on</span> [<span style="color:var(--softm-stop);font-weight:bold">off</span>].</del>',

            noti_icon_status_on : '<span style="color:var(--softm-start);font-weight:bold">Show</span> top notification bar.',
            noti_icon_status_off : '<span style="color:var(--softm-stop);font-weight:bold">Hide</span> top notification bar.',
            test_status_on : '<span style="color:var(--softm-start);font-weight:bold">On</span> Test.',
            test_status_off : '<span style="color:var(--softm-stop);font-weight:bold">Off</span> Test.',
            enhanced_status_on : 'Prevent ANR (Application Not Responding) [<span style="color:var(--softm-start);font-weight:bold">On</span>].',
            enhanced_status_off : 'Prevent ANR (Application Not Responding) [<span style="color:var(--softm-stop);font-weight:bold">Off</span>].',
            work_goto_off_time_status : 'It operates only at the set time.',

            not_installed : "not installed",
            not_set : "Not set",

            ok: "yes",
            cancel: "No",
            confirm: "Confirm",
            retry: "Retry",
            alert: "notification",
            navi: "Start Navi",
            home_page: "Home",
            home: "Home",
            company: "Co.",
            favorite: "Fave",
            destination: "destination",
            recent: "Recent",
            drive: "driving",
            reg_home: "home-registration",
            reg : "Register",
            reg_company: "company-registration",
            del_home : "home-delete",
            del_company : "company-delete",
            del_destination : "basic destination-delete",
            reg_destination: "default destination-registration",
            remove_favorite: "favorite-delete",
            start: "start",
            stop: "stop",
            check_service_running:"Running",
            check_service_stopped:"Stopped",
            permission_notification_access: "Notification Access",
            permission_overlay: "Appear on top",
            permission_usagestats: "Allow access to usage data",
            permission_gps : "Activate location service",
            permission_location : "Allow location permission",
            permission_accessibility : "Allow \"Accessibility\" permission",
            permission_ignore_battery : "Disable \"Power Save Mode\"",

            permission_name_notification_access : "Alarm access",
            permission_name_overlay : "Overlay permission",
            permission_name_usagestats : "Usage information access permission",
            permission_name_gps : "Location service permission",
            permission_name_location : "Location permission",
            permission_name_accessibility : "Accessibility permission",
            permission_name_ignore_battery : "Power saving mode permission",
            permission_name_post_notifications : "Notification permission",

            navi_auto_start_enable: "Run",
            navi_auto_start_wait: "Wait",
            navi_auto_start_disable: "Never",
            popup_enable: "Keep",
            popup_disable: "Close",
            navi_mode: "Mode",
            map_mode: "Map",
            home_to_co: "home↔co",
            home_to_fave: "home↔fave",
            /* SOFTM-OVERLAY-INTRO START 날짜:20260521 : 목적지 오버레이 안내 카드 라벨 */
            overlay_mode: "Overlay mode",
            overlay_basic: "Basic",
            overlay_destination: "Destination",
            destination_overlay_try: "Try it once",
            destination_overlay_keep_basic: "Keep basic",
            /* SOFTM-OVERLAY-INTRO END 날짜:20260521 */

            navi_auto_start: "Navi auto-run",
            navi_popup: "Navi Popup",
            app_update_delay_time: "App update delay time",
            search_placeholder: "place, address and phone number",
            search_placeholder_appselect: "App name",
            search_placeholder_bluetooth: "Bluetooth name",
            search_placeholder_wifi: "WIFI name",
            search: "Search",
            map: "Map",
            full_features: "Full features",
            use_enable: "Used",
            use_disable: "Unused",
            run_on_charge: "When charging",
            run_on_bluetooth: "When connected to Bluetooth",
            run_on_wifi: "When connected to WIFI",
            exclude_run_on_screen: "Screen on",
            exclude_run_on_screen_time: "Check Time",

            status_setting:"Status setting",
            run_status_screen_start:"Start",
            run_status_screen_stop:"Stop",
            
            run_status_on_screen_stopped:"Only run when the screen is <b style='color:var(--softm-start)'>on</b>. [<span style='color:var(--softm-stop);font-weight:bold'>off</span>]",
            run_status_on_screen:"Only run when the screen is <b style='color:var(--softm-start)'>on</b>.",
            run_status_off_screen_stopped:"Only run when the screen is <b style='color:var(--softm-stop)'>off</b>. [<span style='color:var(--softm-stop);font-weight:bold'>off</span>]",
            run_status_off_screen:"Only run when the screen is <b style='color:var(--softm-stop)'>off</b>.",
            run_status_lock_screen:"Run only when the screen is <b style='color:var(--softm-stop)'>locked</b>.",
            run_status_unlock_screen:"Run only when the screen is <b style='color:var(--softm-stop)'>unlocked</b>.",

            run_status_screen_time_for_start:"Chk",
            run_status_screen_time_for_stop:"Chk",
            screen_mode_always:"Always",
            screen_mode_none:"Not",
            screen_mode_unlock:"unLock",
            screen_mode_on:"On",
            screen_mode_off:"Off",
            screen_mode_lock:"Lock",

            run_speed_conditions:"Speed",
            run_speed_limit_time:"limit time",
            run_speed_limit:"Speed",
            notification_icon: "Notificaton Bar",
            improved_execution: "Improved execution",
            overlay_wait_time: "waiting time",
            renavi_prevent_time: "replay prevention",
            work_goto_off_time:"Go to work/Off work",
            work_goto_time:"Go to work",
            work_off_time:"Off work",
            navi:"Navi",
            hour:"hour",
            sec:"Sec" ,
            min:"min",
            day:"day",
            check_day:"day",
            check_hour:"hour",
            check_min:"min",
            check_sec:"sec",
            none:"none",
            km_per_hour:"km/h" ,
            speed:"Speed" ,
            permission_settings_no:"Use without permission",
            permission_settings:"Permission Settings",
            select:"Select",
            appselect:"Select App",
            bluetoothselect:"Select Bluetooth",
            wifiselect:"Select WIFI",
            normal_operation:"Normal",
            permission_check:"Permission check",
            permission_enable:"enable",
            status:"Status",
            navi_app:"App/Navi",
            music_app:"App/Music",
            all_charging:"All",
            wired_charging:"Wired",
            wireless_charging:"Wireless",
            wifi_connected:"Connected",
            using_reg_home:"Use registration address",
            independence_condition:"independence condition",
            stop_none: "None",
            stop_basic: "Basic",
            stop_recent: "Recent App",
            stop_when_destination_search:"Only after entering destination guidance",
            stop_when_destination_search2:"Exit works only in the state of entering the destination search.",

            charge: "Charge",
            bluetooth: "Bluetooth",
            wifi: "Wifi",
            wifi_detail: "Wifi(Wireless)",
            tethering: "Tethering",
            airplane_mode: "Airplane Mode",
            screen_on: "Screen on",
            unlock: "Unlock",
            lock: "Lock",
            completed_lock: "Lock(completed)",
            lockon: "On",
            lockoff: "Off",
            play_music: "Play music",
            home_screen: "Home Screen",
            power_off: "Power off",
            use: "Use",
            on: "On",
            off: "Off",
            finish: "Stop",
            function: "Function",
            app_start: "Run",
            app_stop: "Stop",
            mode: "Mode",
            set_whether_run_app :"Set whether to run the app.",
            home_n_company_reg: "Change Home/Company",
            stop_recent_all: "All",
            mail_qna: "E-mail",
            qna_top_message: "Please let us know if you have any inconveniences or questions while using the app.<br/> We will check and respond quickly. :)",
            qna_comment_message: "Please send us the contents below along with the symptoms.",
            qna_comment_detail_message1: "Related screenshots or videos",
            qna_comment_detail_message2: "Problem Symptom Path and Description",
            qna_comment_detail_message3: "Model name",
            qna_comment_detail_message4: "Device system (OS) version",
            qna_comment_detail_message5: "app version",
            qna_comment_detail_message6: "Country/Language",
            laboratory:"Laboratory",
            all_app:"All",
            service_check:"Check Service",
            service_check_noti:"Check Notification",
            service_check_noti_basic:"Basic",
            service_check_noti_log:"Log",
            license: "license",
            license_user: "license",
            ad_view_user: "Ad Viewing",
            beta_user: "Beta",
            free_user: "Free",
            subs_user: "Subscription",
            lifetime_user: "Lifetime",
            
            period_of_use: "Period of use",
            expiration: "expiration",
            watch_the_ad_and_cheer: "Cheer", 
            ad_view: "View ad",
            ad_replay_time: "Get Rewarded",
            ad_view_available: "",
            order_id: "order number",
            bill_monthly: "Monthly",
            bill_monthly_price: "USD 0.49",
            bill_monthly_oneday_price: "USD 0.015 per day",
            bill_lifetime: "Lifetime",
            bill_lifetime_price: "USD 4.9",
            bill_lifetime_discount_price: "USD 0.15",
            bill_lifetime_oneday_price: "Once",
            bill_lifetime_50percent_discount: "50% discount",
            subscription_management: "Subscription",
            app_purchase: "Purchase [Buy a cup of coffee]",
            app_purchase1: "Purchase",
            app_purchase2: "[Buy ]",
            app_purchase3: "[a cup of coffee]",
            copy_order_id:"Copy order number",
            tmap_map:"TMap Map",
            google_map:"Google Map",
            destination_execution_hold_time:"Navi destination hold time",
            destination_execution_hold_time2:"hold time",
            save:"Save"
          },
          title: {
            main: "Basic",
            run_status_screen:"Screen",
            execution: "Execution",
            exclude_run: "Exclude Run Option",
            stop: "Stop",
            home_n_company: "Home/Company",
            setting: "Basic Setting",
            navi: "Navi",
            start_stop_on_off: "On/Off",
            destination: "Destination",

            support_the_developers: "Cheer up",
            support_developers: "Cheer up",
            ad_ticket: "AD/Tickets",

            home:"Home",
            setting:"Setting",
            run_options: "Run Options",
            start_stop:"Start/Stop",
            home_company: "Home/Company",
            favorite: "Favorite",
            contact_us: "Contact us",
            rate_the_app: "Rate the app",
            goto_map_store: "Check for updates",
            permission:"Permission",
            membership:"Membership",
            laboratory:"Laboratory",
            time:"Time",

            menu_home:"Home",
            menu_setting:"Setting",
            menu_navi_setting:"Navi Setting",
            menu_detail_setting:"Detail Setting",
            menu_start_stop:"Start/Stop",
            menu_run_options: "Run Opt",
          },
          message:{
            save: "Saved.",
            would_save : "Would you like to save?",
            would_change : "Would you like to change it?",
            first_start : "Drive Auto Nav",
            first_start1 : "🚙 Navigation app",
            // first_start2 : "When charging, connecting to Bluetooth, or Wi-Fi,<br/>you can start or end the navigation app.",
            first_start2 : "Auto-start navigation in your car",
            first_start3 : "Save Home, Work, and Favorites",
            first_start4 : "Works with Google Maps, Waze, Baidu Maps",
            first_start5 : "Optional music launch",
            
            first_group1 : "🏡 Affiliation",
            first_group2 : "Good Words with God",
            first_group3 : "Let's Pray Together",
            first_select_group : "Please select one or more affiliations.",

            select_music_app1 : "🎵 <span>Music Player</span> ",

            install_start : "{app_name} is not installed.<br>Would you like to <span style='color:var(--softm-start)'>install</span>  it?",
            confirm_home_delete : "Are you sure you want to delete home?",
            confirm_company_delete : "Are you sure you want to delete company?",
            confirm_destination_delete : "Are you sure you want to delete basic destination?",
            confirm_favorite_delete: "Are you sure you want to delete favorite?",
            confirm_app_pacakge_delete : "Do you want to delete the set app information?",
            select_music_playback_device : 'Select the music [<span class="bold color_start">playback device</span>]. [<span class="bold color_start">Click</span>]',

            confirm_on : "Would you like to turn it <span style='color:var(--softm-start)'>on</span>?",
            confirm_off : "Would you like to turn it <span style='color:var(--softm-stop)'>off</span>?",
            confirm_enable: "<span style='color:var(--softm-start)'>'Enabled'</span> Are you sure?",
            confirm_disable: "<span style='color:var(--softm-stop)'>'Disabled'</span> Are you sure?",
            confirm_start: "<span style='color:var(--softm-start)'>Start</span> Are you sure?",
            confirm_stop: "<span style='color:var(--softm-stop)'>Exit</span> Are you sure?",
            guide_home: "<B>\"Guide\"</B>.",
            guide_company: "<B>\"Company\"</B>.",
            guide_destination: "<B>\"Destination\"</B>.",
            guide_navi: "<B>\"Safe driving\"</B>.",
            guide_pindrop: "<B>\"Search to the specified location\"</B>.",
            guide_not_home: "<B color='grey'>\"Please register your home address.\"</B>",
            guide_not_company: "<B color='grey'>\"Please register your company address.\"</B>",
            guide_not_destination: "<B color='grey'>\"Please register your destination address.\"</B>",
            guide_message_touch : "<B>Click on the \"map\"</B> to specify a location.",
            
// popup_guide_10: "After displaying the guide icon, <B>\"10 seconds\" followed by <span style='color:var(--softm-start)'>Start</span></B>. ",
// popup_guide_10stop: "After displaying the guide icon, <B>\"10 seconds\" followed by <span style='color:var(--softm-stop)'>Exit</span></B>. "
            popup_guide_10: "Keep the guide icon <span style='color:var(--softm-start)'>></span>.",
            popup_guide_10stop: "Turn off the guide icon <span style='color:var(--softm-stop)'>Close</span>.",
            popup_guide_10_save: "Your guide icon settings have been saved.",

            popup_enable: "guide icon <span style='color:var(--softm-start)'>Display</span>.",
            popup_disable: "guide icon <span style='color:var(--softm-stop)'>Close</span>.",

            navi_auto_start_enable: "<span style='color:var(--softm-start)'>Run</span> the app.",
            navi_auto_start_wait: "<span style='color:var(--softm-stop)'>Wait</span> for the app to start.",
            navi_auto_start_disable: "<span style='color:var(--softm-stop)'>Do not</span> start the app.",

            overlay_wait_time: "Wait pop-up display time before running app",
            
            map_mode_guide: "<B><span style='color:var(--softm-start)'>\"{mapName}\"</span></B> is displayed.",
            map_mode_auto_google: "Google navigation app selected, so map setting changed to {mapName}.", // SOFTM-MAPMODE: Google 계열 내비 선택 시 지도 자동 변경 안내 문구 추가. 2026-05-19

            mode_guide_1: "<B>\"Company\"</B> to <<B><span style='color:var(--softm-start)'>\"AM\"</span></B>, <B><span style='color:var(--softm-stop)'>\"Afternoon\"</span></B> to <B>\"Home\"</B>." ,
            mode_guide_2: "<B>\"Destination\"</B> in <<B><span style='color:var(--softm-start)'>\"AM\"</span></B>, <B><span style='color:var(--softm-stop)'>\"Afternoon\"</span></B> to <B>\"Home\"</B>." ,
            mode_guide_3: "<B>\"Navi\"</B> only.",
            mode_guide_save: "Guide mode settings have been saved.",

            permissions_required : "Permissions required",

            permission:'When you start it, <span style="color:var(--softm-start);font-weight:bold">Navigation execution</span> is executed.',
            permission1:'<span style="color:var(--softm-start);font-weight:bold">Display Over the apps</span> settings',
            permission2:'<span style="color:var(--softm-start);font-weight:bold">Allow access to usage information</span>',
            permission3:'<span style="color:var(--softm-start);font-weight:bold">Allow "Notification Access"</span>',
            permission4:'<span style="color:var(--softm-start);font-weight:bold">Allow "Location Information Access"</span>',
            permission5: 'Set <span style="color:var(--softm-start);font-weight:bold">"Accessibility" permission</span>',
            permission5_1 : '<span style="font-weight:bold">"Scope of use of “AccessibilityService API”</span>',
            permission_post_notifications : '<span style="font-weight:bold">Notification runtime permission</span>',
            permission_alarm : '<span style="font-weight:bold">Accurate alarm permission</span>',

            permission5_2_1 : 'Bluetooth On/Off',
            permission5_2_2 : 'WIFI On/Off',
            permission5_2_3 : 'Tethering On/Off',
            permission5_2_4 : 'Airplane mode On/Off',
            permission5_2_5 : 'Screen lock On/Off',
            permission5_2_6 : 'Media play/pause',
            permission5_2_7 : 'Close app',

            permission5_reset: 'Set <span style="color:var(--softm-start);font-weight:bold">Reset "Accessibility" permission</span>',
            
            permission6: 'Set <span style="color:var(--softm-start);font-weight:bold">Disabled "Power Saving Mode"</span>',
            permission7: 'Set <span style="color:var(--softm-start);font-weight:bold">"Bluetooth" permission</span>',
            permission8: 'Set <span style="color:var(--softm-start);font-weight:bold">"Change system settings" permission</span>',
            permission_grant_app_select:'Please select the app "<B>Drive Auto Nav</B>".',
            permission_grant_on_for_overlay0 : '"Show quick destination selection button while driving"',
            permission_grant_on_for_overlay1 : 'Select "<B>T-Map Auto-Run</B>"',
            permission_grant_on_for_overlay2 : 'Permission "<b>On</b>"',

            permission_grant_on_app_select : 'Select "<B>T-Map Auto-Run</B>"',
            permission_grant_on_for_alarm1 : 'Allow permission "<b>On</b>"',
            permission_grant_on_for_alarm2 : 'Please return to "<b>Back</b>".',

            permission_grant_on:'Turn on "<B>Permit permission</B>",',
            permission_grant_backkey_return:'Press <B>Back</B> to return to the screen.',
            permission_grant_on_for_notification_access : '"Notification access"to turn on the right.',
            permission_grant_on_for_notification_access_2 : 'The accuracy of program operation can be improved.',
            permission_grant_on_for_location_information_access : '"<B>Drive Auto Nav</B>" collects location data even when the app is closed or not in use, and provides a function to prevent duplicate execution when running Navigation.',
            permission_grant_on_for_background_location_information_access : 'When running destination guidance, <b>use <b>location data</b> in the <b>background</b>.',
            permission_grant_on_for_background_location_information_access_10 : '<B>Select [Always Allow]"</B>.',
            permission_grant_on_for_post_notifications : '<b>Enable</b> the <b>top notification bar</b>. You can use the <Br/>function conveniently.',
            permission_grant_on_for_post_notifications2 : '<B>Select "[Allow]"</B>.',

            permission_grant_on_for_accessibility : 'It is used to turn the function On/Off when running the app.<br/>It is used to terminate the function after running the app.',
            permission_grant_on_for_accessibility2 : 'Select "<B>Installed Apps</B>"',
            permission_grant_on_for_accessibility3 : 'Select "<B>T-Map Auto-Run</B>"',
            permission_grant_on_for_accessibility4 : 'Permission "<b>On</b>"',

            permission_grant_add_for_location : 'Improved execution performance',
            permission_grant_add_for_ignore_battery : 'Prevent system-induced app shutdown',
            permission_grant_add_for_notification_access : 'Prevent duplicate app execution',
            permission_grant_add_for_accessibility : 'Activate "Start/Stop" routine (On/Off)',
            permission_grant_add_for_overlay : '"Show app launch icon',
            permission_grant_add_for_post_notifications : 'Allow to send notifications',

            permission_enable_enhanced_feature : 'If you have trouble running the app, try enabling the permission.',
            
            permission_accessibility_enable : "Enable accessibility permission and use all features.",
            permission_accessibility_enable_for_stop : "Enable the permission and use the stop function.",

            permission_grant_on_for_accessibility_reset : '<b class="color_stop">Accessibility permission has been revoked.</b><br/><br/>To operate normally, <B>the permission</B> should be "<B class="color_stop">turned off</B>" -> "<B class="color_stop">turned on</B>".',
            permission_grant_on_for_accessibility_reset4 : '<b class="color_stop">Turn off"</b> the <b>permissions</b> -&gt; <b class="color_stop">"Turn on"</b>.',
            permission_grant_on_for_accessibility_reset5 : '<b class="color_stop">Please "turn on" accessibility permissions</b>.',

            permission_grant_on_for_accessibility_ignore : "<span class='color_start'>You must have the Accessibility Service Permission</span> to use <br/><span class='color_start'>enhanced features</span>. <br/><span class='color_stop'>Would you like to use it without setting permissions</span>?",

            permission_grant_on_for_ignore_battery : 'For normal app use, you must "<B>Exclude</B>" the app from the "<B>Optimize Battery Usage</B>" list.\\n"<B>Notification Bar</B>" You will need it to remove it.',
            permission_grant_on_for_ignore_battery2 : 'After clicking the <B>[OK]</B> button, select <B>[Allow]</B> when the system notification dialog box appears.',
            permission_grant_on_for_bluetooth : 'Permission required to query and turn on/off Bluetooth.',
            permission_grant_on_for_write_settings : 'Required to change system settings.',
            permission_grant_on_for_write_settings2 : 'After clicking the <B>[OK]</B> button, select <B>[Allow]</B> when the system notification dialog box appears.',
            disable_noti_icon_1 : 'To "disable" the notification bar, you must allow "Accessibility".',
            disable_noti_icon_2 : 'To "disable" the notification bar, you must turn off "Power Saving Mode.',
            network_not_connected:'Network connection is difficult.<br/><br/><span style="color:var(--softm-start);font-weight:bold">Please try again after a while.</span> ',
            permission_necessary:"This is an essential permission for execution.",
            data_not_found: "No data was found.",
            address_not_exist: "There is no address to guide.",
            all_granted: "All permissions are <span class='color_start'>normal</span>.",
            install_app: "Install App.",
            select_app: "Select App.",
            music_play_setting: "Music playback is turned off.",
            install_tmap: "Install Tmap.",
            confirm_enable_bluetooth : "To query the Bluetooth list, you must use Bluetooth.\n Do you want to \"<span style='color:var(--softm-start)'>turn on</span>\"Bluetooth?",
            when_connected :"When connected, <span class='color_start'>runs</span>.",
            not_exec :"Execution <span class='color_stop'>stopped</span>.",
            app_disabled :"<span class='color_stop'>Disabled</span>.",
            bluetooth_not_supported :"<span class=''>Bluetooth is not supported</span>.",
            comming_soon :"<span class=''>Coming soon</span>.",
            drag_pin_to_position :"<span class=''>Drag the pin to position it</span>.",
            reg_home :"\“Home\” has been registered.",
            reg_company :"\"Company\” has been registered.",
            reg_favorite :"\"Favorite\” has been registered.",
            del_home :"\"Home\" has been deleted.",
            del_company :"\"Company\" has been deleted.",
            del_favorite :"\"Basic Destination\" has been deleted.",
            must_enable_bluetooth : "This feature requires Bluetooth permission to be enabled.",
            must_enable_wifi : "This feature requires WIFI permission to be enabled.",
            must_enable_accessbility : "This feature requires accessibility permission to be enabled.",
            noti_title:"[Urgent] Background service update error occurred.",
            noti_msg1:"There is an error in the current version and the app is not working properly.",
            noti_msg2:"When the next version is updated, <span style='color:var(--softm-stop)'>uninstall</span> and <span span style='color:var(--softm-start)'>reinstall</span>.",
            noti_msg3:"An update is currently in progress.",
            noti_msg4:"Please wait a moment and the next version will be updated.",
            noti_msg5:"Sorry for the inconvenience. TT",
            noti_msg6:"thank you.",
            drag_pin_adjust_position:"Drag the pin to adjust its position.",
            please_support:"Please support us. ^^ :)",
            please_support_msg1:'-&nbsp;<span style="color:black">Your subscription period will be extended when you watch an ad.</span>',
            please_support_msg2:'-&nbsp;<span style="color:#000000">Ad view</span>&nbsp;:&nbsp;<span style="color:black">Waiting time</span>&nbsp;<span class="bold" style="color:#B40404">"{fromSec}"</span> seconds → <span class="bold" style="color:#B40404">"3"</span> seconds',
            please_support_msg3:'-&nbsp;<b><b style="color:#B40404">Subscriber</b>&nbsp;:&nbsp;<b style="color:black">Waiting time</b>&nbsp;<span class="bold" style="color:#B40404">"10"</span> seconds → <span class="bold" style="color:#B40404">"0"</span> seconds</b>',
            next_ad_view : 'There are {waitTime} left until the next ad view time.',
            ad_max_time_ad_view : 'Viewing has been restricted due to exceeding the ad viewing time.',
            ad_view_time_exceeded : 'Viewing has been restricted due to exceeding the ad viewing time.',
            ad_view_thanks:"Thank you for your support. ^^ :)",
            pay_in_app_subs_thanks:"Thank you for using the subscription. ^^ :)",
            pay_in_app_lifetime_thanks:"Thank you for using the lifetime pass. ^^ :)",
            destination_execution_hold_time:"After searching for the destination, <span style='color:var(--softm-start)' class='bold'>the original destination is guided</span>.",
            install_completed: "Installation <span style='color:var(--softm-start)' class='bold'>complete</span>.<br/>Thank you for using it.",
            install_completed1: "Installation <span style='color:var(--softm-start)' class='bold'>complete</span>.",
            install_completed2: "Thank you for using it.",
            first_subscribe: "2 months free subscribe.",
            first_subscribe_msg1: '<span class="skyblue bold">You can use it for free for 2 months when you first subscribe.',
            first_subscribe_msg2: '<span class="red">If you do not want to switch to a paid subscription</span>, you can "<b>cancel</b>" <b>before the free period ends</b>.',
            overlay_opened : "Guide icon displayed",
            /* SOFTM-OVERLAY-INTRO START 날짜:20260521 : 목적지 오버레이 안내 카드 문구 */
            destination_overlay_status_destination: '<B><span style="color:var(--softm-start)">"Destination"</span></B> overlay mode is used.',
            destination_overlay_status_basic: '<B><span style="color:var(--softm-stop)">"Basic"</span></B> overlay mode is used.',
            destination_overlay_intro_title: "New destination overlay is available",
            destination_overlay_intro_body: "Choose Home, Work, or Favorites directly from the overlay and start your preferred navigation app.",
            destination_overlay_intro_enabled: "Destination overlay was enabled. You can switch back in settings.",
            destination_overlay_intro_keep_basic: "Basic overlay mode will be kept."
            /* SOFTM-OVERLAY-INTRO END 날짜:20260521 */
          },
          google_navi: {
            current_location: "Current location",
            selected_location: "Selected location",
            edit_location: "Edit location",
            google_map: "Google Map",
            switch_to_tmap: "View TMap Map", // SOFTM-MAPSWITCH: 지도 전환 버튼 문구를 보기 액션으로 변경. 2026-05-19
            switch_to_google: "View Google Map",
            search_type: "Search type",
            destination_type: "Destination type",
            destination_list: "Destination list",
            place_or_address: "Place or address",
            initializing: "Initializing...",
            start_navi: "Start Navi",
            delete: "Delete",
            edit_name: "Edit name",
            add_favorite: "Add favorite",
            remove_favorite: "Remove favorite",
            save: "Save",
            home_save: "Save home",
            company_save: "Save company",
            destination: "Destination",
            recent_destination: "Recent destinations",
            map_selected_title: "Map point",
            destination_search: "Destination search",
            edit_pin_guide: "Drag the red edit pin to adjust the location.",
            map_move_or_search: "Move the map or search, then choose a destination.",
            search_place_or_address: "Search by place name or address.",
            recent_filter_placeholder: "Search recent list (initials supported)",
            favorite_filter_placeholder: "Search favorites (initials supported)",
            current_location_loading: "Checking current location...",
            current_location_moved: "Moved to current location.",
            guide_select_save: "\"{name}\" location selected. Adjust it, then tap \"{label} Save\".",
            guide_modified: "\"{name}\" location was adjusted.",
            guide_after_modify_save: "After adjusting, tap \"{label} Save\".",
            no_destination_current_save: "{label} destination is not set. You can save the current location.",
            no_destination_checking_current: "{label} destination is not set. Checking current location...",
            registered_destination: "{label} destination is set.",
            guide_to_destination: "Guiding to \"{name}\".",
            guide_no_destination: "\"{label}\" destination is not set.",
            map_click_to_set: "Click \"Map\" to set a location.",
            map_point: "{label} map point",
            map_point_generic: "Map point",
            map_selected: "Location selected on the map. Drag the pin to adjust it.",
            input_search_keyword: "Enter a search keyword.",
            searching: "Searching...",
            search_result_count: "{count} search results found.",
            no_search_result: "No search results.",
            data_not_found: "No data was found.",
            cannot_search: "Cannot search.",
            change_order: "Change order",
            search_history: "Search history",
            selected: "{name} selected",
            search_history_prefix: "Search history: {name}",
            recent_result_count: "{count} recent destinations found.",
            recent_count: "{count} recent destinations",
            no_recent_filter: "No matching recent destinations.",
            no_recent: "No recent destinations.",
            favorite_result_count: "{count} favorites found.",
            favorite_count: "{count} favorites",
            no_favorite_filter: "No matching favorites.",
            no_favorite: "No favorites.",
            select_destination_first: "Select a destination first.",
            saved_destination: "{label} destination was saved. Current {label}: {name}",
            destination_saved: "{label} destination was saved.",
            destination_deleted_status: "{label} destination was deleted.",
            destination_deleted: "{label} destination was deleted.",
            search_history_cannot_favorite: "Search history cannot be added to favorites.",
            favorite_name: "Favorite name",
            favorite_name_edit: "Edit favorite name",
            favorite_add_canceled: "Adding favorite was canceled.",
            favorite_added_status: "Added to favorites: {name}",
            favorite_registered: "Favorite registered.",
            favorite_already_registered: "Already registered in favorites.",
            favorite_edit_canceled: "Editing favorite name was canceled.",
            favorite_edit_failed: "Cannot edit favorite name.",
            favorite_edit_status: "Favorite name updated: {name}",
            favorite_edit_done: "Favorite name updated.",
            favorite_order_saved: "Favorite order saved.",
            favorite_order_save_failed: "Cannot save favorite order.",
            favorite_default_location: "Favorite location",
            my_location_name: "My location",
            specified_location: "Selected location",
            pin_adjusted_status: "Pin location was adjusted.",
            pin_adjusted: "Pin location adjusted.",
            favorite_removed_status: "Removed from favorites.",
            favorite_removed: "Favorite removed.",
            confirm_remove_favorite: "Delete this favorite?",
            favorite_remove_canceled: "Favorite deletion was canceled.",
            dialog_no: "No",
            dialog_yes: "Yes",
            dialog_cancel: "Cancel",
            dialog_ok: "Save",
            no_address_to_guide: "No address to guide.",
            navi_starting: "Starting navigation: {name}",
            navi_started: "Navigation started.",
            move_search_screen: "Moving to search screen: {name}",
            local_storage_error: "Cannot open local storage.",
            destination_default: "Destination",
            api_key_missing: "Google Maps API key is missing.",
            api_key_restricted: "Check Google Maps API key authentication or API restrictions.",
            script_load_failed: "Failed to load Google Maps script.",
            map_element_not_found: "Map area was not found.",
            address_no_result: "No address search results.",
            places_permission: "Check Google Places API permission or API restrictions.",
            places_over_query: "Check Google Places API usage limits.",
            places_error: "Google Places search error: {status}",
            search_result: "Search result",
            address_result: "Address result"
            // SOFTM-I18N: Google 지도 신규 페이지의 화면/상태/오류 문구 키 추가. 2026-05-19
          },
          toast:{
            run_option_on : "Turn <span style='color:var(--softm-start)'>on</span>.",
            run_option_off : "Turn <span style='color:var(--softm-stop)'>on</span>.",
            enable : "<span style='color:var(--softm-start)'>Enabled</span>",
            disable : "<span style='color:var(--softm-stop)'>Diabled</span>",
            start: "<span style='color:var(--softm-start)'>start</span>.",
            stop: "<span style='color:var(--softm-stop)'>stop</span>.",
            grant:"Permission <span style='color:var(--softm-start)'>set</span>.",
            notgrant_notification_access:"Required permission to run. <BR/><span style='color:var(--softm-stop)'>\"Allow permission\"</span> \"Turn on\"." ,
            notgrant_overlay:"Required permission to run. <BR/><span style='color:var(--softm-stop)'>\"Allow permission\"</span> \"Turn on\"." ,
            notgrant_usagestats:"Required permission to run. <BR/><span style='color:var(--softm-stop)'>\"Please grant permission\"</span> \"Turn on\"." ,
            notgrant_gps:"Use location <span style='color:var(--softm-stop)'>\"Permission\"</span> \"Turn on\"",
            notgrant_location:"Required Location permission to run. <BR/><span style='color:var(--softm-stop)'>\"Please grant permission\"</span> \"Turn on\"." ,
            notgrant_bluetooth: "This is a required permission to use Bluetooth. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_alarm: "This is a required permission to use the alarm. Please turn on <BR/><span style='color:var(--softm-stop)'>\"Allow permission\"</span>.",            notgrant_accessibility: "This permission is required to disable the alarm bar. <BR/><span style='color:var(--softm-stop)'>\"On\" \"Allow permission\"</span>.",
            notgrant_ignore_battery: "This permission is required to disable the alarm bar. <BR/><span style='color:var(--softm-stop)'>\"On\" \"Allow permission\"</span>.",
            notgrant_write_settings: "This permission is required to change system settings. <BR/><span style='color:var(--softm-stop)'>\"On\" \"Allow permission\"</span>.",
            loading_applist: "Retrieving app list... Please wait.",
          }
        },
        myModule: {
          "key": "안녕하십니까"
        }
      },
      ko : {
        translation: {
          label: {
            app: "앱",
            run: "실행",
            app_name : "티맵자동실행",
            top_bar : "티맵자동실행",
            first_start : "시작",
            refresh_start : "새로고침",
            after_second : "초 후 실행됨",
            status_app_enable : '동작이 [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">활성화</span></span>]됨.',
            status_app_disable : '동작이 [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">비활성화</span></span>]됨.',
            status_stop : '충전시 실행 [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">중지</span></span>]됨.',
            status_start : '충전시 실행 [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">시작</span></span>]됨.',
            status_bluetooth_stop : '블루투스연결시 실행 [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">중지</span></span>]됨.',
            status_bluetooth_start : '블루투스연결시 실행 [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">시작</span></span>]됨.',
            status_wifi_stop : '와이파이연결시 실행 [<span id="spnState"><span style="color:var(--softm-stop);font-weight:bold">중지</span></span>]됨.',
            status_wifi_start : '와이파이연결시 실행 [<span id="spnState"><span style="color:var(--softm-start);font-weight:bold">시작</span></span>]됨.',
            status_exclude_run_on_screen_start : '<b>화면이 켜진 상태에서 실행 <span style="color:var(--softm-stop);font-weight:bold">안함</span> [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].</b>',
            status_exclude_run_on_screen_stop : '<del>화면이 켜진 상태에서 실행 <span style="color:var(--softm-stop);font-weight:bold">안함</span> [<span style="color:var(--softm-stop);font-weight:bold">꺼짐</span>].</del>',
            status_run_speed_start : '<b><span style="color:var(--softm-start);font-weight:bold">{runSpeedLimitTime}</span>분 이내에 <span style="color:var(--softm-start);font-weight:bold">{runSpeedLimit}</span>km/h에 도달하면 <span style="color:var(--softm-start);font-weight:bold">실행</span>합니다. [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].</b>',
            status_run_speed_stop : '<del><span style="color:var(--softm-start);font-weight:bold">{runSpeedLimitTime}</span>분 이내에 <span style="color:var(--softm-start);font-weight:bold">{runSpeedLimit}</span>km/h에 도달하면 <span style="color:var(--softm-start);font-weight:bold">실행</span>합니다. [<span style="color:var(--softm-stop);font-weight:bold">꺼짐</span>].</del>',
            status_geofence_start : '<b><span style="color:var(--softm-start);font-weight:bold">{radiusMeter}</span>m 이내에 진입하면 <span style="color:var(--softm-start);font-weight:bold">동작</span>합니다. [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].</b>',
            status_geofence_stop : '<del><span style="color:var(--softm-start);font-weight:bold">{radiusMeter}</span>m 이내에 진입하면 <span style="color:var(--softm-start);font-weight:bold">동작</span>합니다. [<span style="color:var(--softm-start);font-weight:bold">꺼짐</span>].</del>',
            
            status_run_status_on_screen_start : '<b>화면이 켜진 상태에서 실행 <span style="color:var(--softm-start);font-weight:bold">함</span> [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].</b>',
            status_run_status_on_screen_stop : '<del>화면이 켜진 상태에서 실행 <span style="color:var(--softm-start);font-weight:bold">함</span> [<span style="color:var(--softm-stop);font-weight:bold">꺼짐</span>].</del>',
            status_run_status_off_screen_start : '<b>화면이 꺼진 상태에서 실행 <span style="color:var(--softm-start);font-weight:bold">함</span> [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].</b>',
            status_run_status_off_screen_stop : '<del>화면이 꺼진 상태에서 실행 <span style="color:var(--softm-start);font-weight:bold">함</span> [<span style="color:var(--softm-stop);font-weight:bold">꺼짐</span>].</del>',
            status_app_update_delay_time : '앱 업데이트를 지정한 시간 만큼 미룹니다.<br/>[{waitTime}]',

            noti_icon_status_on : '상단 알림바에 [<span style="color:var(--softm-start);font-weight:bold">표시</span>].',
            noti_icon_status_off : '상단 알림바에 [<span style="color:var(--softm-stop);font-weight:bold">숨김</span>].',
            test_status_on : '테스트 [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].',
            test_status_off : '테스트 [<span style="color:var(--softm-stop);font-weight:bold">꺼짐</span>].',
            enhanced_status_on : 'ANR(응답없음) 방지 [<span style="color:var(--softm-start);font-weight:bold">켜짐</span>].',
            enhanced_status_off : 'ANR(응답없음) 방지 [<span style="color:var(--softm-stop);font-weight:bold">꺼짐</span>].',            
            work_goto_off_time_status : '설정된 시간에만 동작합니다.',

            not_installed : "미설치",
            not_set : "설정안함",
            
            ok : "예",
            cancel : "아니오",
            confirm : "확인",
            retry : "다시시도",
            alert : "알림",
            navi : "안내",
            home_page: "홈",
            home : "집",
            company : "회사",
            favorite : "즐겨찾기",
            destination : "목적지",
            recent : "최근",
            drive : "운전",
            reg_home : "집-등록",
            reg : "등록",
            reg_company : "회사-등록",
            del_home : "집-삭제",
            del_company : "회사-삭제",
            del_destination : "기본목적지-삭제",
            reg_destination: "기본목적지-등록",
            remove_favorite : "즐겨찾기-삭제",
            start : "시작",
            stop : "정지",
            check_service_running:"실행중",
            check_service_stopped:"중지됨",
            permission_notification_access : "알람 접근 허용",
            permission_overlay : "다른 앱 위에 표시",
            permission_usagestats : "사용정보 접근 허용",
            permission_gps : "위치 서비스 활성화",
            permission_location : "위치 권한 허용",
            permission_accessibility : "접근성 권한 허용",
            permission_ignore_battery : "절전모드 해제",

            permission_name_notification_access : "알람 접근",
            permission_name_overlay : "오버레이 권한",
            permission_name_usagestats : "사용정보 접근 권한",
            permission_name_gps : "위치 서비스 권한",
            permission_name_location : "위치 권한",
            permission_name_accessibility : "접근성 권한",
            permission_name_ignore_battery : "절전모드 권한",
            permission_name_post_notifications : "알림 권한",

            navi_auto_start_enable: "실행",
            navi_auto_start_wait: "대기",
            navi_auto_start_disable: "안함",

            popup_enable: "유지",
            popup_disable: "닫기",
            navi_mode: "안내모드",
            map_mode: "지도",
            home_to_co: "집↔회사",
            home_to_fave: "집↔즐겨찾기",
            /* SOFTM-OVERLAY-INTRO START 날짜:20260521 : 목적지 오버레이 안내 카드 라벨 */
            overlay_mode: "오버레이 방식",
            overlay_basic: "기본",
            overlay_destination: "목적지",
            destination_overlay_try: "한 번 사용해보기",
            destination_overlay_keep_basic: "기본 방식 유지",
            /* SOFTM-OVERLAY-INTRO END 날짜:20260521 */

            navi_auto_start: "내비 자동실행",
            navi_popup: "안내아이콘",
            app_update_delay_time: "앱 업데이트 미룸 시간",
            search_placeholder: "장소, 주소, 전화번호 검색",
            search_placeholder_appselect: "초성:ㅌㅁ,티맵",
            search_placeholder_bluetooth: "블루투스",
            search_placeholder_wifi: "와이파이",
            search: "검색",
            map: "지도",
            full_features: "전체기능",
            use_enable: "사용",
            use_disable: "미사용",
            run_on_charge: "충전시",
            run_on_bluetooth: "블루투스 연결시",
            run_on_wifi: "와이파이 연결시",
            exclude_run_on_screen: "화면 켜진 상태",
            exclude_run_on_screen_time: "체크 시간",
            status_setting:"상태 설정",
            run_status_screen_start:"시작",
            run_status_screen_stop:"종료",

            run_status_on_screen_stopped:"화면 <b style='color:var(--softm-start)'>켜진</b> 상태만 실행.[<span style='color:var(--softm-stop);font-weight:bold'>안함</span>]",
            run_status_on_screen:"화면 <b style='color:var(--softm-start)'>켜진</b> 상태만 실행.",
            run_status_off_screen_stopped:"화면 <b style='color:var(--softm-stop)'>꺼진</b> 상태만 실행.[<span style='color:var(--softm-stop);font-weight:bold'>안함</span>]",
            run_status_off_screen:"화면 <b style='color:var(--softm-stop)'>꺼진</b> 상태만 실행.",
            run_status_lock_screen:"화면 <b style='color:var(--softm-stop)'>잠김</b> 상태만 실행.",
            run_status_unlock_screen:"화면 <b style='color:var(--softm-start)'>열린</b> 상태만 실행.",

            run_status_screen_time_for_start:"체크",
            run_status_screen_time_for_stop:"체크",
            screen_mode_always:"항상",
            screen_mode_none:"안함",
            screen_mode_unlock:"열림",
            screen_mode_on:"켜짐",
            screen_mode_off:"꺼짐",
            screen_mode_lock:"잠금",
            run_speed_conditions:"속력",
            run_speed_limit_time:"제한시간",
            run_speed_limit:"속력",
            notification_icon: "알림바",
            improved_execution: "향상된 실행",
            overlay_wait_time: "대기시간",
            renavi_prevent_time: "재실행 방지",
            work_goto_off_time:"출/퇴근",
            work_goto_time:"출근",
            work_off_time:"퇴근",
            navi:"내비",
            hour:"시간",
            sec:"초",
            min:"분",
            day:"일",
            check_day:"일",
            check_hour:"시간",
            check_min:"분",
            check_sec:"초",
            none:"안함",
            km_per_hour:"km/h" ,
            speed:"속력" ,
            permission_settings_no:"권한 없이 이용",
            permission_settings:"권한 설정",
            select:"선택",
            appselect:"앱 선택",
            bluetoothselect:"블루투스 선택",
            wifiselect:"와이파이 선택",
            normal_operation:"정상",
            permission_check:"권한확인",
            permission_enable:"활성화",
            status:"상태",
            navi_app:"앱/내비",
            music_app:"음악/앱",
            all_charging:"모두",
            wired_charging:"유선",
            wireless_charging:"무선",
            wifi_connected:"연결됨",
            using_reg_home:"등록 주소 사용",
            independence_condition:"독립 조건",
            stop_none: "안함",
            stop_basic: "기본",
            stop_recent: "최근앱",
            stop_when_destination_search:"목적지 안내 진입후에만",
            stop_when_destination_search2:"목적지 탐색을 진입한 상태에서만 종료가 동작합니다.",

            charge: "충전",
            bluetooth: "블루투스",
            wifi: "와이파이",
            wifi_detail: "무선(WIFI)",
            tethering: "테더링",
            airplane_mode: "비행기모드",
            screen_on: "화면켜기",
            lock: "잠금",
            unlock: "해제",
            completed_lock: "잠금(완료)",
            lockon: "잠금",
            lockoff: "해제",
            play_music: "음악재생",
            home_screen: "홈화면",
            power_off: "전원종료",
            use: "사용",
            on: "켜기",
            off: "끄기",
            finish: "종료",
            function: "기능",
            app_start: "시작",
            app_stop: "종료",
            mode: "모드",
            set_whether_run_app :"앱 실행 여부를 설정합니다.",
            home_n_company_reg: "집/회사 등록",
            stop_recent_all: "모두닫기",
            mail_qna: "메일 문의하기",
            qna_top_message: "앱 사용에 불편한점이나, 궁금한 점을 알려주세요.<br/> 빠르게 확인 후 답변 드리도록 하겠습니다. :)",
            qna_comment_message: "아래 내용과 증상을 함께 보내주세요.",
            qna_comment_detail_message1: "관련 스크린샷 또는 비디오",
            qna_comment_detail_message2: "문제 증상 경로 및 설명",
            qna_comment_detail_message3: "기종 이름",
            qna_comment_detail_message4: "기기 시스템(OS) 버전",
            qna_comment_detail_message5: "앱 버전",
            qna_comment_detail_message6: "국가/언어",
            laboratory:"연구소",
            all_app:"전체",
            service_check:"체크서비스",
            service_check_noti:"체크알림",
            service_check_noti_basic:"기본",
            service_check_noti_log:"로그",
            license: "라이센스",
            license_user: "라이센스 사용자",
            ad_view_user: "광고보기 사용자",
            beta_user: "베타 사용자",
            free_user: "무료 사용자",
            subs_user: "구독 사용자",
            lifetime_user: "평생 사용자",

            period_of_use: "사용기간",
            expiration: "만료",
            watch_the_ad_and_cheer: "응원하기",
            ad_view: "광고보기",
            ad_replay_time: "보상받기",
            ad_view_available: "",
            order_id: "주문번호",
            bill_monthly: "월간",
            bill_monthly_price: "₩500원",
            bill_monthly_oneday_price: "하루에 16원",
            bill_lifetime: "평생",
            bill_lifetime_price: "₩5,000원",
            bill_lifetime_discount_price: "₩10,000원",
            bill_lifetime_oneday_price: "한번",
            bill_lifetime_50percent_discount: "50% 할인",
            subscription_management: "구독관리",
            app_purchase: "구입 [커피한잔쏘기]",
            app_purchase1: "구입",
            app_purchase2: "[커피한잔",
            app_purchase3: "쏘기]",
            copy_order_id:"주문번호 복사",
            tmap_map:"티맵지도",
            google_map:"구글지도",
            destination_execution_hold_time:"내비 목적지 안내 유지 시간",
            destination_execution_hold_time2:"유지 시간",
            save:"저장"
          },
          title: {
            main: "기본",
            run_status_screen:"화면",
            execution: "실행",
            exclude_run: "실행 제외",
            stop: "종료",
            home_n_company: "집/회사",
            navi_setting: "내비설정",
            setting: "설정",
            navi:"안내",
            start_stop_on_off: "On/Off",
            destination: "목적지",
            
            support_the_developers: "응원하기",
            support_developers: "응원하기",
            ad_ticket: "광고/이용권",

            home:"홈",
            setting:"설정",
            run_options: "실행옵션",
            start_stop:"시작/종료",
            home_company: "집/회사",
            favorite: "즐겨찾기",
            contact_us: "문의하기",
            rate_the_app: "어플 평가하기",
            goto_map_store: "업데이트 확인",
            permission:"권한",
            membership:"멤버쉽",
            laboratory:"연구소",

            time:"시간",

            menu_home:"홈",
            menu_setting:"설정",
            menu_navi_setting:"내비설정",
            menu_detail_setting:"세부설정",
            menu_start_stop:"시작/종료",
            menu_run_options: "실행옵션",
            menu_pray:"기도",
            menu_profile:"내정보",

          },
          message:{
            save : "저장 되었습니다.",
            would_save : "저장 하시겠습니까?",
            would_change : "변경 하시겠습니까?",
            first_start : "티맵 자동실행",
            first_start1 : "🚙 내비 앱",
            // first_start2 : "충전, 블루투스, 와이파이 연결하면,<br/>내비게이션 앱을 시작, 종료할 수 있습니다.",
            first_start2 : "차에 타면 내비 자동 실행",
            first_start3 : "집//회사/즐겨찾기 바로 안내",
            first_start4 : "음악 앱 자동 실행",
            first_start5 : "블루투스/와이파이/전원 연결 감지",
            
            first_group1 : "🏡 소속",
            first_group2 : "하나님과 함께하는 좋은말씀",
            first_group3 : "함께 기도해요",
            first_select_group : "소속을 하나 이상 선택하세요.",

            select_music_app1 : "🎵 <span>음악 플레이어</span> ",

            install_start : "'{app_name}' 설치 되어 있지 않습니다.<br><span style='color:var(--softm-start)'>설치</span>  하시겟습니까?",
            install_start : "'{app_name}' 설치 되어 있지 않습니다.<br><span style='color:var(--softm-start)'>설치</span>  하시겟습니까?",
            confirm_home_delete : "집을 삭제 하시겠습니까?",
            confirm_company_delete : "회사를 삭제 하시겠습니까?",
            confirm_destination_delete : "기본목적지를 삭제 하시겠습니까?",
            confirm_favorite_delete : "즐겨찾기를 삭제 하시겠습니까?",
            confirm_app_pacakge_delete : "설정된 앱 정보를 삭제하시겠습니까?",
            select_music_playback_device : '음악 [<span class="bold color_start">재생장치</span>] 선택 가능.[<span class="bold color_start">클릭</span>]',

            confirm_on : "<span style='color:var(--softm-start)'>켜(on)</span>시겠습니까?",
            confirm_off : "<span style='color:var(--softm-stop)'>끄(off)</span>시겠습니까?",
            confirm_enable : "<span style='color:var(--softm-start)'>활성화</span> 하시겠습니까?",
            confirm_disable : "<span style='color:var(--softm-stop)'>비활성화</span> 하시겠습니까?",
            confirm_start : "<span style='color:var(--softm-start)'>시작</span> 하시겠습니까?",
            confirm_stop : "<span style='color:var(--softm-stop)'>종료</span> 하시겠습니까?",
            guide_home : "<B>\"집\"</B>으로 안내 합니다.",
            guide_company : "<B>\"회사\"</B>로 안내 합니다.",
            guide_destination : "<B>\"목적지\"</B>로 안내 합니다.",
            guide_navi : "<B>\"안전운전\"</B>을 실행 합니다.",
            guide_pindrop : "<B>\"검색 지정한 위치로\"</B> 안내 합니다.",
            guide_not_home : "<B color='grey'>\"집 주소를 등록하세요.\"</B>",
            guide_not_company : "<B color='grey'>\"회사 주소를 등록하세요.\"</B>",
            guide_not_destination : "<B color='grey'>\"목적지 주소를 등록하세요.\"</B>",
            guide_message_touch : "<B>\"지도\"</B>를 클릭해 위치를 지정하세요.",
//            popup_guide_10 : "안내아이콘 표시후, <B>\"10초\" 뒤에 안내를 <span style='color:var(--softm-start)'>시작</span></B> 합니다.",
//            popup_guide_10stop: "안내아이콘 표시후, <B>\"10초\" 뒤에 안내를 <span style='color:var(--softm-stop)'>종료</span></B> 합니다."
            popup_guide_10 : "안내아이콘을 <span style='color:var(--softm-start)'>유지</span>.",
            popup_guide_10stop: "안내아이콘을 <span style='color:var(--softm-stop)'>닫기</span>.",
            popup_guide_10_save : "안내아이콘 설정이 저장 되었습니다.",

            popup_enable : "안내아이콘 <span style='color:var(--softm-start)'>유지</span>.",
            popup_disable: "안내아이콘 <span style='color:var(--softm-stop)'>닫기</span>.",

            navi_auto_start_enable: "앱 시작 <span style='color:var(--softm-start)'>실행</span>.",
            navi_auto_start_wait: "앱 시작 <span style='color:var(--softm-start)'>대기</span>.",
            navi_auto_start_disable: "앱 시작 <span style='color:var(--softm-stop)'>안함</span>.",
            overlay_wait_time: "앱 실행전 대기 팝업 표시시간",
            
            map_mode_guide: "<B><span style='color:var(--softm-start)'>\"{mapName}\"</span></B>를 표시합니다.",
            map_mode_auto_google: "Google 지도 앱을 선택해 지도 설정을 {mapName}로 변경했습니다.", // SOFTM-MAPMODE: Google 계열 내비 선택 시 지도 자동 변경 안내 문구 추가. 2026-05-19

            mode_guide_1 : "<B><span style='color:var(--softm-start)'>\"오전\"</span></B>에 <B>\"회사\"</B>,  <B><span style='color:var(--softm-stop)'>\"오후\"</span></B>에 <B>\"집\"</B> 안내 합니다.",
            mode_guide_2 : "<B><span style='color:var(--softm-start)'>\"오전\"</span></B>에 <B>\"목적지\"</B>, <B><span style='color:var(--softm-stop)'>\"오후\"</span></B>에 <B>\"집\"</B> 안내 합니다.",
            mode_guide_3 : "<B>\"내비\"</B>만 실행합니다.",
            mode_guide_save : "안내모드 설정이 저장 되었습니다.",

            permissions_required : "권한설정 필요",
            permissions_required : "접근성 권한을  필요",

            permission : '시동을 걸면 <span style="color:var(--softm-start);font-weight:bold">티맵실행</span>이 실행됩니다.',
            permission1 : '<span style="color:var(--softm-start);font-weight:bold">다른 앱 위에 표시</span> 설정',
            permission2 : '<span style="color:var(--softm-start);font-weight:bold">사용정보 접근 허용</span> 설정',
            permission3 : '<span style="color:var(--softm-start);font-weight:bold">알람 접근 허용</span> 설정',
            permission4 : '<span style="color:var(--softm-start);font-weight:bold">위치 정보 접근 허용</span> 설정',
            permission5 : '<span style="color:var(--softm-start);font-weight:bold">접근성 권한</span> 설정',
            permission5_1 : '<span style="font-weight:bold">"AccessibilityService API" 이용 범위</span>',
            permission_post_notifications : '<span style="font-weight:bold">알림 런타임 권한</span>',
            permission_alarm : '<span style="font-weight:bold">정확한 알람 권한</span>',
            
            permission5_2_1 : '블루투스 On/Off',
            permission5_2_2 : '와이파이 On/Off',
            permission5_2_3 : '테더링 On/Off',
            permission5_2_4 : '비행기모드 On/Off',
            permission5_2_5 : '화면잠금 On/Off',
            permission5_2_6 : '미디어 재생/일시중지',
            permission5_2_7 : '앱 종료',

            permission5_reset : '<span style="color:var(--softm-start);font-weight:bold">접근성 권한</span> 재설정',

            permission6 : '<span style="color:var(--softm-start);font-weight:bold">절전모드 해제</span> 설정',
            permission7 : '<span style="color:var(--softm-start);font-weight:bold">블루투스 권한</span> 설정',
            permission8 : '<span style="color:var(--softm-start);font-weight:bold">시스템설정 변경 권한</span> 설정',
            permission_grant_app_select : '"<B>티맵자동실행</B>" 앱을 선택하세요.',

            permission_grant_on_for_overlay0 : '"운전 중 빠른 목적지 선택 버튼 표시"',
            permission_grant_on_for_overlay1 : '"<B>티맵자동실행</B>" 선택',
            permission_grant_on_for_overlay2 : '사용 권한 "<b>켬</b>"',

            permission_grant_on : '"<B>권한 허용</B>"을 켜고,',
            permission_grant_backkey_return : '<B>뒤로가기</B> 눌러, 화면으로 돌아오세요.',
            
            permission_grant_on_for_notification_access : '"<B>티맵자동실행</B>" 선택',
            permission_grant_on_for_notification_access_2 : '사용 권한 "<b>켬</b>"',

            permission_grant_on_for_location_information_access : '"<B>티맵자동실행</B>"은 앱이 종료되었거나 사용 중이 아닐 때도 위치 데이터를 수집하여 티맵 실행시 중복 실행을 방지하는 기능을 제공합니다.',
            permission_grant_on_for_background_location_information_access : '목적지 안내 실행시 <b>백그라운드</b>에서 <b>위치 데이터</b>를 활용합니다.',
            permission_grant_on_for_background_location_information_access_10 : '<B>"[항상허용]"</B>을 선택하세요.',
            permission_grant_on_for_post_notifications : '<b>상단 알림바</b>를 <b>활성화</b>하세요.<Br/>기능을 편리하게 이용할 수 있습니다.',
            permission_grant_on_for_post_notifications2 : '<B>"[허용]"</B>을 선택하세요.',

            permission_grant_on_for_accessibility : '앱 실행시 기능을 On/Off를 위해 이용됩니다.<br/>앱 실행후, 종료기능을 위해 이용됩니다.',
            permission_grant_on_for_accessibility2 : '"<B>설치된 앱</B>" 선택',
            permission_grant_on_for_accessibility3 : '"<B>티맵자동실행</B>" 선택',
            permission_grant_on_for_accessibility4 : '사용 권한 "<b>켬</b>"',
            
            permission_grant_add_for_location : '실행성능 향상',
            permission_grant_add_for_ignore_battery : '시스템에의한 앱 중지 방지',
            permission_grant_add_for_notification_access : '앱 중복실행 방지',
            permission_grant_add_for_accessibility : '"안전운전 실행 및 시작/종료" 루틴(On/Off) 활성화',
            permission_grant_add_for_overlay : '앱 실행 아이콘 표시',
            permission_grant_add_for_post_notifications : '알림을 보내도록 허용',

            permission_enable_enhanced_feature : '앱 실행에 문제가 있다면 권한을 활성화 해보세요.',                        

            permission_accessibility_enable : "접근성 권한을 활성화하고 모든기능을 사용하세요.",
            permission_accessibility_enable_for_stop : "권한을 활성화하고 종료기능을 이용하세요.",

            permission_name_notification_access : "알람 접근",
            permission_name_overlay : "오버레이 권한",
            permission_name_usagestats : "사용정보 접근 권한",
            permission_name_gps : "위치 서비스 권한",
            permission_name_location : "위치 권한",
            permission_name_accessibility : "접근성 권한",
            permission_name_ignore_battery : "절전모드 권한",

            permission_grant_on_for_accessibility_reset : '<b class="color_stop">접근성 권한이 중단 되었습니다.</b><br/><br/>정상 동작을 위해 <B>권한</B>을 "<B class="color_stop">껏다</B>" -> "<B class="color_stop">켜세요</B>".',
            permission_grant_on_for_accessibility_reset4 : '<b>사용 권한</b>을 <b class="color_stop">"껏다"</b> -&gt; <b class="color_stop">"켜세요"</b>.',
            permission_grant_on_for_accessibility_reset5 : '<b class="color_stop">접근성 권한을 "켜주세요"</b>.',
            
            permission_grant_on_for_accessibility_ignore : "<span class='color_start'>접근성 서비스 권한</span>이 있어야,<br/><span class='color_start'>향상된 기능</span>을 이용할 수 있습니다.<br/><span class='color_stop'>권한설정 없이</span> 이용 하시겠습니까?",
            
            permission_grant_on_for_ignore_battery : '정상적인 앱 사용을 위해 해당 어플을 "<B>배터리 사용량 최적화</B>" 목록에서 "<B>제외</B>"해야 합니다.<br/>"<B>알림바</B>"를 제거하기 위해 필요합니다.',
            permission_grant_on_for_ignore_battery2 : '<B>[확인]</B> 버튼을 누른 후 시스템 알림 대화 상자가 뜨면 <B>[허용]</B> 을 선택해 주세요.',
            permission_grant_on_for_bluetooth : '블루투스를 조회 및 켜거나 끄기 위해 필요한 권한입니다.',
            permission_grant_on_for_write_settings : '시스템 설정을 변경하기 위해 필요합니다.',
            permission_grant_on_for_write_settings2 : '<B>[확인]</B> 버튼을 누른 후 시스템 알림 대화 상자가 뜨면 <B>[허용]</B> 을 선택해 주세요.',
            disable_noti_icon_1 : '알림바를 "해제"하시려면, "접근성" 허용을 해야합니다.',
            disable_noti_icon_2 : '알림바를 "해제"하시려면, "절전모드" 해제를 설정해야 합니다.',
            network_not_connected : '네트웍 연결이 어렵습니다.<br/><br/><span style="color:var(--softm-start);font-weight:bold">잠시 후 다시 시도해 주세요.</span>',
            permission_necessary : "실행에 있어 필수적인 권한입니다.",
            data_not_found : "조회된 자료가 없습니다.",
            address_not_exist: "안내할 주소가 없습니다.",
            all_granted: "모든 권한이 <span class='color_start'>정상</span>입니다.",
            install_app: "앱을 설치하세요.",
            select_app: "앱을 선택하세요.",
            music_play_setting: "음악 재생이 꺼져있습니다.",

            install_tmap: "티맵을 설치하세요.",
            confirm_enable_bluetooth : "블루투스 목록을 조회하려면, 블루투스를 사용해야합니다.\n 블루투스를 \"<span style='color:var(--softm-start)'>켜</span>\"시겠습니까?",
            when_connected :"연결시 <span class='color_start'>동작</span>.",
            not_exec :"<span class='color_stop'>실행 중지</span>.",
            app_disabled :"동작이 <span class='color_stop'>비활성화</span>됨.",
            bluetooth_not_supported :"<span class=''>블루투스가 지원되지 않습니다.</span>.",
            comming_soon :"<span class=''>준비중 입니다</span>.",
            drag_pin_to_position :"<span class=''>핀을 드래그해 위치를 지정하세요</span>.",
            reg_home :"\"집\"이 등록되었습니다.",
            reg_company :"\"회사\"가 등록되었습니다.",
            reg_favorite :"\"즐겨찾기\"가 등록되었습니다.",
            del_favorites :"\"즐겨찾기\"가 삭제되었습니다.",
            del_home :"\"집\"이 삭제되었습니다.",
            del_company :"\"회사\"가 삭제되었습니다.",
            del_favorite :"\"기본목적지\"가 삭제되었습니다.",
            must_enable_bluetooth : "블루투스 권한을 활성화해야 사용할 수 있는 기능입니다.",
            must_enable_wifi : "WIFI 권한을 활성화해야 사용할 수 있는 기능입니다.",
            must_enable_accessbility : "접근성 권한을 활성화해야 사용할 수 있는 기능입니다.",
            noti_title:"[긴급] 백그라운드 서비스 업데이트 오류 발생.",
            noti_msg1:"현재 버전에 오류가 있어 앱이 정상적으로 동작하지 않습니다.",
            noti_msg2:"다음 버전이 업데이트 되면 <span style='color:var(--softm-stop)'>삭제후</span> <span span style='color:var(--softm-start)'>재설치</span>하세요.",
            noti_msg3:"현재 업데이트가 진행중입니다.",
            noti_msg4:"조금만 기다리시면 다음 버전이 업데이트 됩니다.",
            noti_msg5:"사용에 불편을 드려 죄송합니다.TT",
            noti_msg6:"감사합니다.",
            drag_pin_adjust_position:"핀을 드래그해서 위치를 조정하세요.",
            please_support:"응원 부탁드려요. ^^ :)",
            please_support_msg1:'-&nbsp;<span style="color:black">광고를 시청하면 사용기간이 연장되요.</span>', 
            please_support_msg2:'-&nbsp;<span style="color:#000000">광고시청</span>&nbsp;:&nbsp;<span style="color:black">대기시간</span>&nbsp;<span class="bold" style="color:#B40404">"{fromSec}"</span>초 → <span class="bold" style="color:#B40404">"3"</span>초', 
            please_support_msg3:'-&nbsp;<b><b style="color:#B40404">구독회원</b>&nbsp;:&nbsp;<b style="color:black">대기시간</b>&nbsp;<span class="bold" style="color:#B40404">"10"</span>초 → <span class="bold" style="color:#B40404">"0"</span>초</b>', 
            next_ad_view : '다음 광고 시청시간 까지 : {waitTime} 남았습니다.',
            ad_max_time_ad_view : '광고 시청시간 초과로 시청이 제한 되었습니다.',
            ad_view_time_exceeded : '광고 시청시간 초과로 시청이 제한 되었습니다.',
            ad_view_thanks:"응원 감사합니다. ^^ :)",
            pay_in_app_subs_thanks:"구독을 이용해주셔서 감사합니다. ^^ :)",
            pay_in_app_lifetime_thanks:"평생이용권을 이용해주셔서 감사합니다. ^^ :)",
            destination_execution_hold_time:"목적지를 검색으로 탐색 후 <span style='color:var(--softm-start)' class='bold'>기존 목적지를 안내</span> 합니다.",
            install_completed: "설치가 <span style='color:var(--softm-start)' class='bold'>완료</span> 되었습니다.<br/>이용해 주셔서 감사합니다.",
            install_completed1: "설치가 <span style='color:var(--softm-start)' class='bold'>완료</span> 되었습니다.",
            install_completed2: "이용해 주셔서 감사합니다.",
            first_subscribe: "처음 구독시<br/>2달 무료",
            first_subscribe_msg1: '<span class="skyblue bold">처음 구독시 2달간 무료</span>로 이용할 수 있습니다.',
            first_subscribe_msg2: '<span class="red">유료 정기 결제</span> <b>전환을 원치 않으면</b> <b>무료 기간 종료전</b>에 "<b>취소</b>" 할 수 있습니다.',
            overlay_opened : "안내아이콘 표시됨",
            /* SOFTM-OVERLAY-INTRO START 날짜:20260521 : 목적지 오버레이 안내 카드 문구 */
            destination_overlay_status_destination: '<B><span style="color:var(--softm-start)">"목적지"</span></B> 방식을 사용합니다.',
            destination_overlay_status_basic: '<B><span style="color:var(--softm-stop)">"기본"</span></B> 방식을 사용합니다.',
            destination_overlay_intro_title: "새 목적지 오버레이를 사용할 수 있어요",
            destination_overlay_intro_body: "집/회사/즐겨찾기를 오버레이에서 바로 선택하고 원하는 내비 앱으로 실행할 수 있습니다.",
            destination_overlay_intro_enabled: "목적지 오버레이로 변경했어요. 설정에서 언제든 기본 방식으로 되돌릴 수 있습니다.",
            destination_overlay_intro_keep_basic: "기본 오버레이 방식을 유지합니다."
            /* SOFTM-OVERLAY-INTRO END 날짜:20260521 */
          },
          google_navi: {
            current_location: "현재 위치",
            selected_location: "선택 위치",
            edit_location: "위치 수정",
            google_map: "Google 지도",
            switch_to_tmap: "티맵지도 보기", // SOFTM-MAPSWITCH: 지도 전환 버튼 문구를 보기 액션으로 변경. 2026-05-19
            switch_to_google: "구글지도 보기",
            search_type: "검색 유형",
            destination_type: "목적지 유형",
            destination_list: "목적지 목록",
            place_or_address: "장소명 또는 주소",
            initializing: "초기화 중입니다...",
            start_navi: "내비 시작",
            delete: "삭제",
            edit_name: "이름 수정",
            add_favorite: "즐겨찾기 추가",
            remove_favorite: "즐겨찾기 삭제",
            save: "저장",
            home_save: "집 저장",
            company_save: "회사 저장",
            destination: "목적지",
            recent_destination: "최근 목적지",
            map_selected_title: "지도 지정",
            destination_search: "목적지 검색",
            edit_pin_guide: "빨간 수정 핀을 드래그하면 위치를 조정할 수 있습니다.",
            map_move_or_search: "지도를 움직이거나 검색 후 목적지를 선택하세요.",
            search_place_or_address: "장소명 또는 주소를 검색하세요.",
            recent_filter_placeholder: "최근 목록 검색 (초성: 광명시, ㄱㅁㅅ)",
            favorite_filter_placeholder: "즐겨찾기 검색 (초성: 광명시, ㄱㅁㅅ)",
            current_location_loading: "현재 위치를 확인 중입니다...",
            current_location_moved: "현재 위치로 이동했습니다.",
            guide_select_save: "\"{name}\" 위치를 선택했습니다. 수정 후 \"{label} 저장\"을 누르세요.",
            guide_modified: "\"{name}\" 위치를 수정했습니다.",
            guide_after_modify_save: "수정 후 \"{label} 저장\"을 누르세요.",
            no_destination_current_save: "{label} 목적지가 없습니다. 현재 위치를 저장할 수 있습니다.",
            no_destination_checking_current: "{label} 목적지가 없습니다. 현재 위치를 확인 중입니다...",
            registered_destination: "{label} 목적지가 등록되어 있습니다.",
            guide_to_destination: "\"{name}\"으로 안내합니다.",
            guide_no_destination: "\"{label}\" 목적지가 없습니다.",
            map_click_to_set: "\"지도\"를 클릭해 위치를 지정하세요.",
            map_point: "{label} 지정 위치",
            map_point_generic: "지도 지정 위치",
            map_selected: "지도에서 선택한 위치입니다. 핀을 드래그해서 수정할 수 있습니다.",
            input_search_keyword: "검색어를 입력하세요.",
            searching: "검색 중입니다...",
            search_result_count: "{count}건의 검색 결과가 있습니다.",
            no_search_result: "검색 결과가 없습니다.",
            data_not_found: "조회된 자료가 없습니다.",
            cannot_search: "검색할 수 없습니다.",
            change_order: "순서 변경",
            search_history: "검색 이력",
            selected: "{name} 선택됨",
            search_history_prefix: "검색 이력: {name}",
            recent_result_count: "최근 목적지 {count}건이 검색되었습니다.",
            recent_count: "최근 목적지 {count}건",
            no_recent_filter: "검색된 최근 목적지가 없습니다.",
            no_recent: "최근 목적지 목록이 없습니다.",
            favorite_result_count: "즐겨찾기 {count}건이 검색되었습니다.",
            favorite_count: "즐겨찾기 {count}건",
            no_favorite_filter: "검색된 즐겨찾기가 없습니다.",
            no_favorite: "즐겨찾기 목록이 없습니다.",
            select_destination_first: "먼저 목적지를 선택하세요.",
            saved_destination: "{label} 목적지를 저장했습니다. 현재 {label}: {name}",
            destination_saved: "{label} 목적지가 저장되었습니다.",
            destination_deleted_status: "{label} 목적지를 삭제했습니다.",
            destination_deleted: "{label} 목적지가 삭제되었습니다.",
            search_history_cannot_favorite: "검색 이력은 즐겨찾기에 추가할 수 없습니다.",
            favorite_name: "즐겨찾기 이름",
            favorite_name_edit: "즐겨찾기 이름 수정",
            favorite_add_canceled: "즐겨찾기 추가를 취소했습니다.",
            favorite_added_status: "즐겨찾기에 추가했습니다: {name}",
            favorite_registered: "즐겨찾기가 등록되었습니다.",
            favorite_already_registered: "이미 즐겨찾기에 등록되어 있습니다.",
            favorite_edit_canceled: "즐겨찾기 이름 수정을 취소했습니다.",
            favorite_edit_failed: "즐겨찾기 이름을 수정할 수 없습니다.",
            favorite_edit_status: "즐겨찾기 이름을 수정했습니다: {name}",
            favorite_edit_done: "즐겨찾기 이름이 수정되었습니다.",
            favorite_order_saved: "즐겨찾기 순서를 저장했습니다.",
            favorite_order_save_failed: "즐겨찾기 순서를 저장할 수 없습니다.",
            favorite_default_location: "즐겨찾기 위치",
            my_location_name: "내 위치",
            specified_location: "지정 위치",
            pin_adjusted_status: "핀 위치를 수정했습니다.",
            pin_adjusted: "핀 위치를 조정했습니다.",
            favorite_removed_status: "즐겨찾기에서 삭제했습니다.",
            favorite_removed: "즐겨찾기가 삭제되었습니다.",
            confirm_remove_favorite: "즐겨찾기를 삭제 하시겠습니까?",
            favorite_remove_canceled: "즐겨찾기 삭제를 취소했습니다.",
            dialog_no: "아니오",
            dialog_yes: "예",
            dialog_cancel: "취소",
            dialog_ok: "저장",
            no_address_to_guide: "안내할 주소가 없습니다.",
            navi_starting: "내비게이션을 시작합니다: {name}",
            navi_started: "내비게이션을 시작합니다.",
            move_search_screen: "검색 화면으로 이동합니다: {name}",
            local_storage_error: "로컬 저장소를 열 수 없습니다.",
            destination_default: "목적지",
            api_key_missing: "Google Maps API key가 없습니다.",
            api_key_restricted: "Google Maps API key 인증 또는 API 제한 설정을 확인해야 합니다.",
            script_load_failed: "Google Maps 스크립트를 불러오지 못했습니다.",
            map_element_not_found: "지도 영역을 찾을 수 없습니다.",
            address_no_result: "주소 검색 결과가 없습니다.",
            places_permission: "Google Places API 권한 또는 API 제한 설정을 확인해야 합니다.",
            places_over_query: "Google Places API 사용량 한도를 확인해야 합니다.",
            places_error: "Google Places 검색 오류: {status}",
            search_result: "검색 결과",
            address_result: "주소 결과"
            // SOFTM-I18N: Google 지도 신규 페이지의 화면/상태/오류 문구 키 추가. 2026-05-19
          },
          toast:{
            run_option_on : "설정을 <span style='color:var(--softm-start)'>켰</span>습니다.",
            run_option_off : "설정을 <span style='color:var(--softm-stop)'>껐</span>습니다.",
            enable : "<span style='color:var(--softm-start)'>활성화</span>되었습니다.",
            disable : "<span style='color:var(--softm-stop)'>비활성화</span>되었습니다.",
            start : "<span style='color:var(--softm-start)'>시작</span>되었습니다.",
            stop : "<span style='color:var(--softm-stop)'>종료</span>되었습니다.",
            grant: "권한이 <span style='color:var(--softm-start)'>설정</span>되었습니다.",
            notgrant_notification_access: "실행에 필요한 필수 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_overlay: "실행에 필요한 필수 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_usagestats: "실행에 필요한 필수 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_gps: "위치 사용 <span style='color:var(--softm-stop)'>\"권한\"</span>을 \"켜\"주세요.",
            notgrant_location: "실행에 필요한 필수 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_bluetooth: "블루투스 이용을 위해 필요한 필수 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_alarm: "알람을 이용을 위해 필요한 필수 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_accessibility: "알람바 해제를 위해 필요한 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_ignore_battery: "알람바 해제를 위해 필요한 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            notgrant_write_settings: "시스템설정 변경을 위해 필요한 권한입니다. <BR/><span style='color:var(--softm-stop)'>\"권한 허용\"</span>을 \"켜\"주세요.",
            loading_applist: "앱목록 조회중.. 잠시 기다리세요.",
          }
        },
        myModule: {
          "key": "안녕하십니까"
        }
      }
};

var sLng = localStorage.getItem('lng');
 console.info("sLng",sLng);
var p_lang = getParam("lng");
 console.info("p_lang",p_lang);
var lng = null;
if ( p_lang ) lng = p_lang;
else if ( sLng ) lng = sLng;

// lng = !lng?'en':lng;
lng = !lng?navigator.language.split("-")[0]:lng;

localStorage.setItem('lng',lng);
 console.info("lng",lng);
 var i18nInitForDefault = {
        lng: lng,
        debug: true,
        // ns: {
            ns: ['translation', 'myModule'],
            defaultNS: 'translation',
        // },
        resources: messages
};
var i18nInitForJquery = {
        lng: lng=="ko"?lng:"en",
        debug: true,
        ns: {
            namespaces: ['translation', 'myModule'],
            defaultNs: 'translation'
        },
        resStore: messages
};

// using - default i18next
/*
  // console.info(i18next)
    i18next
      .use(i18nextXHRBackend)
      .use(i18nextBrowserLanguageDetector)
      .init(i18nInitForDefault, function(err, t) {
        // init set content
        // updateContent();
        // console.info("aa");
        console.info(i18next.t('key'));

      });
    // window.onload = function() {
    //   debugger;
    //   // i18next("header");
    // }
*/
// using - jquery i18next
//    debugger;
/*  */
$.i18n.init(i18nInitForJquery, function(err, t) {
        // init set content
        // updateContent();
        // console.info("aa");
        // console.info($.i18n.t('apple'));
        console.info($.i18n.t('key'));
});

var drawer = null;
var topAppBar = null;
var drawerListEl = null;

var DRAWER_LIST_INFO = {
  "index.html" : {page:"index.html",visible:true,icon:"home",label:"title.home"}, // 홈
  "setting.html" : {page:"setting.html",visible:true,icon:"settings",label:"title.setting",showOnlySelf:true}, // 설정
  "onoff.html" : {page:"onoff.html",visible:true,icon:"toggle_on",label:"title.start_stop",showOnlySelf:true}, // 시작/종료
  "run_option.html" : {page:"run_option.html",visible:true,icon:"link",label:"title.run_options",showOnlySelf:true,popup:true,reloadAtReturn:true}, // 실행옵션
  "developer_support.html" : {page:"developer_support.html",visible:true,icon:"favorite",label:"title.support_developers",showOnlySelf:true}, // 개발자 응원하기
  "home_company.html" : {page:"home_company.html",visible:true,icon:"home_work",label:"title.home_company",popup:true}, // 집/회사
  "search.html?idx=2" : {page:"search.html",visible:true,icon:"bookmark",label:"title.favorite",pathSearchSame:true,popup:true}, // 즐겨찾기
  // "membership.html" : {icon:"card_membership",label:"title.membership"}, // 멤버쉽
  "laboratory.html" : {page:"laboratory.html",visible:true,icon:"emoji_objects",label:"title.laboratory",popup:true}, // 연구소
  "qna.html" : {page:"qna.html",icon:"forum",visible:true,label:"title.contact_us",popup:true}, // 문의하기
  "goto_map_store.html" : {page:"goto_map_store.html",visible:true,icon:"storefront",label:"title.goto_map_store"}, // 어플 평가하기
  // "rate_the_app.html" : {page:"rate_the_app.html",visible:true,icon:"thumb_up",label:"title.rate_the_app"}, // 어플 평가하기
}


var drawerSelectedIndex = null;
var testClick = 0;
$( document ).ready(function() {
  footerNavigation = [].map.call(document.querySelectorAll(".mdc-bottom-navigation__list-item"),(el,idx)=>{
      var rtnEl = new mdc.ripple.MDCRipple(el);
      rtnEl.listen("click",function(e) {
          $(this).closest("div").find(".mdc-bottom-navigation__list-item").removeClass("mdc-bottom-navigation__list-item--activated");
          $(this).addClass("mdc-bottom-navigation__list-item--activated");
          if ( footerNavigationIndex != idx ) {
            if ( isTest ) {
              fn_OpenUrl(footerNavigationUrl[idx]);
            } else {
              var reqId = footerNavigationUrl[idx].split(".")[0].toLocaleUpperCase();
              window.GetURLCallback = function(url) {
                if ( location.protocol.startsWith("http") && url.startsWith("file") ) {
                  if ( reqId == "index") fn_GoMain(true);
                  else fn_GoFoward("WEB_"+reqId);
                } else {
                  fn_OpenUrl(url);
                }
              }
              fn_GetURL("WEB_" + reqId,"GetURLCallback");
            }
            // windowOpen(footerNavigationUrl[idx]);
          }
      });
      return rtnEl;
  });

  $(".app-bar").click(function(e) {
    if ( testClick == 0 ) {
        setTimeout(function() {
          testClick = 0;
        },20000);
    }
    testClick++;
    if ( testClick == 10 ) {
      fn_GoTest();
      testClick = 0;
    }
  });

  if ( document.querySelector('.mdc-drawer') ) {
    
    drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
    topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(document.getElementById('app-bar'));
    topAppBar.setScrollTarget(document.getElementById('main-content'));
    topAppBar.listen('MDCTopAppBar:nav', () => {
        drawer.open = !drawer.open;
    });
    const mainContentEl = document.querySelector('.main-content');

    document.body.addEventListener('MDCDrawer:opened', () => {
      // mainContentEl.querySelector('input, button').focus();
      // debugger;
      // window.drawerSelectedIndex = drawer.innerList.selectedIndex;
      // drawer.innerList.selectedIndex = window.drawerSelectedIndex;
      
    });

    document.body.addEventListener('MDCDrawer:closed', () => {
        // mainContentEl.querySelector('input, button').focus();
    });

    drawerListEl = document.querySelector('.mdc-drawer .mdc-deprecated-list');

    drawerListEl.addEventListener('click', (event) => {
        drawer.open = false;
        setTimeout(function () {
            var idx = drawer.innerList.selectedIndex;
            var drawerInfos = Object.values(DRAWER_LIST_INFO);
            var urls = Object.keys(DRAWER_LIST_INFO);
            var url = urls[idx];
            var drawerInfo = drawerInfos[idx];
            if ( url  === "goto_map_store.html" ) {
              fn_GotoMarket("net.softm.startnavi.poweron");
              drawer.innerList.selectedIndex = window.drawerSelectedIndex;
              event.preventDefault();
            } else if ( url  === "rate_the_app.html" ) {
                fn_GotoMarket("net.softm.startnavi.poweron");
                drawer.innerList.selectedIndex = window.drawerSelectedIndex;
                event.preventDefault();
            } else {
              if ( drawerInfo.popup ) {
                drawer.innerList.selectedIndex = window.drawerSelectedIndex;
                fn_OpenPop(url);
              } else {
                // windowOpen(url);
                fn_OpenUrl(url);
                // document.location.href = url;
              }
            }
            // location.reload();
            // drawer.innerList.selectedIndex = 0;
        }, 100)
        event.preventDefault();
    });
    //        drawer.innerList.selectedIndex = 2;
    reDrawDrawer();

  }

	$( '<div class="mo-ui-layer progress" style="display:none"><div class="mo-ui-innerlayer"><div class="loading-centered-element"><img src="data:image/png;base64,R0lGODlhIAAgALMAAP///7Ozs/v7+9bW1uHh4fLy8rq6uoGBgTQ0NAEBARsbG8TExJeXl/39/VRUVAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFBQAAACwAAAAAIAAgAAAE5xDISSlLrOrNp0pKNRCdFhxVolJLEJQUoSgOpSYT4RowNSsvyW1icA16k8MMMRkCBjskBTFDAZyuAEkqCfxIQ2hgQRFvAQEEIjNxVDW6XNE4YagRjuBCwe60smQUDnd4Rz1ZAQZnFAGDd0hihh12CEE9kjAEVlycXIg7BAsMB6SlnJ87paqbSKiKoqusnbMdmDC2tXQlkUhziYtyWTxIfy6BE8WJt5YEvpJivxNaGmLHT0VnOgGYf0dZXS7APdpB309RnHOG5gDqXGLDaC457D1zZ/V/nmOM82XiHQjYKhKP1oZmADdEAAAh+QQFBQAAACwAAAAAGAAXAAAEchDISasKNeuJFKoHs4mUYlJIkmjIV54Soypsa0wmLSnqoTEtBw52mG0AjhYpBxioEqRNy8V0qFzNw+GGwlJki4lBqx1IBgjMkRIghwjrzcDti2/Gh7D9qN774wQGAYOEfwCChIV/gYmDho+QkZKTR3p7EQAh+QQFBQAAACwBAAAAHQAOAAAEchDISWdANesNHHJZwE2DUSEo5SjKKB2HOKGYFLD1CB/DnEoIlkti2PlyuKGEATMBaAACSyGbEDYD4zN1YIEmh0SCQQgYehNmTNNaKsQJXmBuuEYPi9ECAU/UFnNzeUp9VBQEBoFOLmFxWHNoQw6RWEocEQAh+QQFBQAAACwHAAAAGQARAAAEaRDICdZZNOvNDsvfBhBDdpwZgohBgE3nQaki0AYEjEqOGmqDlkEnAzBUjhrA0CoBYhLVSkm4SaAAWkahCFAWTU0A4RxzFWJnzXFWJJWb9pTihRu5dvghl+/7NQmBggo/fYKHCX8AiAmEEQAh+QQFBQAAACwOAAAAEgAYAAAEZXCwAaq9ODAMDOUAI17McYDhWA3mCYpb1RooXBktmsbt944BU6zCQCBQiwPB4jAihiCK86irTB20qvWp7Xq/FYV4TNWNz4oqWoEIgL0HX/eQSLi69boCikTkE2VVDAp5d1p0CW4RACH5BAUFAAAALA4AAAASAB4AAASAkBgCqr3YBIMXvkEIMsxXhcFFpiZqBaTXisBClibgAnd+ijYGq2I4HAamwXBgNHJ8BEbzgPNNjz7LwpnFDLvgLGJMdnw/5DRCrHaE3xbKm6FQwOt1xDnpwCvcJgcJMgEIeCYOCQlrF4YmBIoJVV2CCXZvCooHbwGRcAiKcmFUJhEAIfkEBQUAAAAsDwABABEAHwAABHsQyAkGoRivELInnOFlBjeM1BCiFBdcbMUtKQdTN0CUJru5NJQrYMh5VIFTTKJcOj2HqJQRhEqvqGuU+uw6AwgEwxkOO55lxIihoDjKY8pBoThPxmpAYi+hKzoeewkTdHkZghMIdCOIhIuHfBMOjxiNLR4KCW1ODAlxSxEAIfkEBQUAAAAsCAAOABgAEgAABGwQyEkrCDgbYvvMoOF5ILaNaIoGKroch9hacD3MFMHUBzMHiBtgwJMBFolDB4GoGGBCACKRcAAUWAmzOWJQExysQsJgWj0KqvKalTiYPhp1LBFTtp10Is6mT5gdVFx1bRN8FTsVCAqDOB9+KhEAIfkEBQUAAAAsAgASAB0ADgAABHgQyEmrBePS4bQdQZBdR5IcHmWEgUFQgWKaKbWwwSIhc4LonsXhBSCsQoOSScGQDJiWwOHQnAxWBIYJNXEoFCiEWDI9jCzESey7GwMM5doEwW4jJoypQQ743u1WcTV0CgFzbhJ5XClfHYd/EwZnHoYVDgiOfHKQNREAIfkEBQUAAAAsAAAPABkAEQAABGeQqUQruDjrW3vaYCZ5X2ie6EkcKaooTAsi7ytnTq046BBsNcTvItz4AotMwKZBIC6H6CVAJaCcT0CUBTgaTg5nTCu9GKiDEMPJg5YBBOpwlnVzLwtqyKnZagZWahoMB2M3GgsHSRsRACH5BAUFAAAALAEACAARABgAAARcMKR0gL34npkUyyCAcAmyhBijkGi2UW02VHFt33iu7yiDIDaD4/erEYGDlu/nuBAOJ9Dvc2EcDgFAYIuaXS3bbOh6MIC5IAP5Eh5fk2exC4tpgwZyiyFgvhEMBBEAIfkEBQUAAAAsAAACAA4AHQAABHMQyAnYoViSlFDGXBJ808Ep5KRwV8qEg+pRCOeoioKMwJK0Ekcu54h9AoghKgXIMZgAApQZcCCu2Ax2O6NUud2pmJcyHA4L0uDM/ljYDCnGfGakJQE5YH0wUBYBAUYfBIFkHwaBgxkDgX5lgXpHAXcpBIsRADs="></div></div></div>' ).appendTo( $( "body" ) );

    $(".i18n").i18n();
    const snackbarMDC = new mdc.snackbar.MDCSnackbar(
      document.querySelector(".mdc-snackbar")
    );
    snackbarMDC.timeoutMs = 4000; // min 4000
    snackbarMDC.timeout = 2500; // min 4000
    
    // snackbar.open();

    const dialogMDC = new mdc.dialog.MDCDialog(
      document.querySelector(".basic.mdc-dialog")
    );

    // debugger;
    dialogMDC.listen("MDCDialog:opened", () => {
      // alert("opened");
      console.info("opened");
    });

    window.material = {};
    // console.clear();
    //console.info("test1");
    window.material.snackbarClose = function (v) {
		snackbarMDC.close();
	}
    window.material.wTimeout = null;
    window.material.snackbar = function (v) {
      snackbarMDC.labelText = "";
      // var h = $("footer").height();
      var h = $("footer:not(.mdc-dialog__actions)").height();
      snackbarMDC.root.style.bottom = (h) + "px";
      snackbarMDC.close();
      snackbarMDC.open();
      // snackbarMDC.labelText = v;
      snackbarMDC.root.querySelector(".mdc-snackbar__label").innerHTML = v;
      // snackbarMDC.actionButtonText = "aaaaaaaa";
      clearTimeout(window.material.wTimeout);
      window.material.wTimeout = setTimeout(function() {
            snackbarMDC.close();
      },snackbarMDC.timeout);
    }
    snackbarMDC.listen("click",function() {
      snackbarMDC.close();
    })
    window.material.confirm = function (v, f, felse) {
      if ( document.querySelector("#my-dialog-title") != null ) document.querySelector("#my-dialog-title").innerHTML = v;
      document.querySelector(".mdc-dialog .mdc-dialog__actions button:nth-child(1)").style.visibility = "visible";    
      let eventListener = function(e) {
        // alert("closed");
        if (e.detail.action == "accept") {
          if (f) f();
        }
        if (e.detail.action == "close") {
          if (felse) felse();
        }
        console.info("closed action", e.detail.action);
        dialogMDC.unlisten("MDCDialog:closed",eventListener);
      };
      dialogMDC.open();
      dialogMDC.listen("MDCDialog:closed", eventListener);
    }

    window.material.alert = function (v, f,felse) {
      document.querySelector("#my-dialog-title").innerHTML = v;
      document.querySelector(".mdc-dialog .mdc-dialog__actions button:nth-child(1)").style.visibility = "hidden";    
      
      let eventListener = function(e) {
        // alert("closed");
        if (e.detail.action == "accept") {
          if (f) f();
        } else if (e.detail.action == "close") {
            if (felse) felse();
          }
        console.info("closed action", e.detail.action);
        dialogMDC.unlisten("MDCDialog:closed",eventListener);
      };
      dialogMDC.open();
      dialogMDC.listen("MDCDialog:closed", eventListener);
    }
    window.t = function (v,option){
      var vv = $.i18n.t(v);
      if ( option ) {
        // Object.entries(option).map((item)=>{
        //   debugger;
        // });
        vv = vv.replace(/{(.*?)}/g, function(match, p1) {
          return option[p1] || match;
        });
      }
      return vv;
    }
});

window.alert = function (v,f) {
/*
    if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
        AlertUtil.fn_Alert(v,f);
    }else{
        material.alert(v, f);
    }
*/
    material.alert(v, f);
}

window.confirm = function (v,f,felse) {
//    if(CommonUtil.fn_IS_APP() == "I" || CommonUtil.fn_IS_APP() == "A"){
//        fn_Confirm("",v,f);
//    }else{
        material.confirm(v, f, felse);
//    }
}

function snackbar(v) {
    material.snackbar(v);
}

function snackbarClose() {
    material.snackbarClose();
}

function showLoading(v) {
    if ( v ) $('.mo-ui-layer.progress').show();
    else fn_Progress_Show();
//	if(isBrowser) {
//		$('.mo-ui-layer.progress').show();
//	} else {	
//		if ( typeof(Android) !== "undefined") {	
//			Android.showLoading();
//		}
//	}
}

function hideLoading(v) {
    if ( v ) $('.mo-ui-layer.progress').hide();
    else fn_Progress_Hide();
//	window.setTimeout(function() {
//		$('.mo-ui-layer.progress').hide();
////		if(isBrowser) {
////		    $('.mo-ui-layer.progress').hide();
////		} else {	
////			if ( typeof(Android) !== "undefined") {
////			  Android.hideLoading();
////			}
////		}
//	},100);
}

function toast(msg) {
    fn_Toast(msg);
}


function tDataPoiAddress(pos,callback){
    var optionObj = {
        coordType: "WGS84GEO",       //응답좌표 타입 옵션 설정 입니다.
        addressType: "A04"           //주소타입 옵션 설정 입니다.
    };
    var params = {
        onComplete:function(){
//						snackbar(this._responseData.addressInfo.fullAddress);
            callback(this._responseData);
        },
        onProgress:function(){},
        onError:function(){}
    };
    (new Tmapv2.extension.TData()).getAddressFromGeoJson(pos.lat(),pos.lng(), optionObj, params);
}

HTMLElement.prototype.hide = function() {
    this.style.display = "none";
};

HTMLElement.prototype.show = function(display) { // display : "", inline, block
    this.style.display = display?display:"";
};
HTMLElement.prototype.showInline = function(display) { // display : inline
    this.show("inline");
};

HTMLElement.prototype.showBlock = function(display) { // display : block
    this.show("block");
};

function getDistanceFromLatLonInKm(lat1,lng1,lat2,lng2) {
    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lng2-lng1);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function cloneObject(obj) {
  return Object.assign({}, obj);
}

function setAddress(v) {
    if ( v == null )
        document.querySelector("#place_address").hide();
    else {
        document.querySelector("#place_address").show();
        document.querySelector("#place_address").innerText = v;
    }
}

function endScroll(trueCallBack,falseCallBack,offSet){
    offSet = typeof (offSet) === "undefined"?100:offSet;
    function checker(e) {
        var target = e.currentTarget;
        var scrollTop = target.scrollTop || window.pageYOffset;
        var scrollHeight = target.scrollHeight || document.body.scrollHeight;
        console.log("endScroll", scrollHeight - scrollTop, $(target).innerHeight(),(scrollHeight - scrollTop) - $(target).innerHeight());

        //    if (scrollHeight - scrollTop === $(target).innerHeight()) {
        if ((scrollHeight - scrollTop) - $(target).innerHeight() < offSet ) {
            console.log("► End of scroll - true");
            if (trueCallBack) trueCallBack();
        } else {
            console.log("► End of scroll - false");
            if (falseCallBack) falseCallBack();
        }
    }
    $(window).scroll(function (e) {
        checker(e);
    });
    checker({
        currentTarget:window
    });
}

function topScroll(trueCallBack,falseCallBack,offSet){
    offSet = typeof (offSet) === "undefined"?150:offSet;
    function checker(e) {
        var target = e.currentTarget;
        var scrollTop = target.scrollTop || window.pageYOffset;
//        scrollHeight = target.scrollHeight || document.body.scrollHeight;
//        console.log("topScroll", scrollTop, offSet - scrollTop);

        //    if (scrollHeight - scrollTop === $(target).innerHeight()) {
        if (offSet - scrollTop >= 0 ) {
            console.log("► Top of scroll - true");
            if (trueCallBack) trueCallBack();
        } else {
            console.log("► Top of scroll - false");
            if (falseCallBack) falseCallBack();
        }
    }
    $(window).scroll(function (e) {
        checker(e);
    });
    checker({
        currentTarget:window
    });
}

function scrollTopExec(top,time,callBack) {
    top = typeof (top) === "undefined"?0:top;
    time = typeof (time) === "undefined"?300:time;
    $('html, body').animate({
        scrollTop: top
    }, time,function(){
        if (callBack) callBack();
    });
}

function mapPointToTmap(mapPoint) {
    return {
        frontLat:mapPoint.getLat(),
        frontLon:mapPoint.getLon(),
        name:mapPoint.getName(),
        type:mapPoint.getType(),
        gubun:mapPoint.getGubun()
    };
}

function objectToMapPoint(obj) {
    if ( obj ) {
        var mapPoint = null;
        if ( obj.type.value == NaviDestination.HOME.value ) {
            mapPoint = new MapPointForHome(obj.lat,obj.lon,obj.name)
        } else if ( obj.type.value == NaviDestination.COMPANY.value ) {
            mapPoint = new MapPointForCompany(obj.lat,obj.lon,obj.name)
        } else if ( obj.type.value == NaviDestination.FAVORITE.value ) {
            mapPoint = new MapPointForFavorite(obj.lat,obj.lon,obj.name);
        } else {
            mapPoint = new MapPoint(obj.lat,obj.lon,obj.name)
        }
        mapPoint.id = obj.id;
        mapPoint.item = obj.item;
        return mapPoint;
    } else {
        return null;
    }
}

function tmapToMapPoint(tmap) {
    if ( tmap ) {
        var lat = tmap.lat?tmap.lat:tmap.frontLat;
        var lon = tmap.lon?tmap.lon:tmap.frontLon;
        var name = tmap.name;
        if ( tmap.type.value == NaviDestination.HOME.value ) {
            return Object.assign(new MapPointForHome(lat,lon,name),tmap);
        } else if ( tmap.type.value == NaviDestination.COMPANY.value ) {
            return new MapPointForCompany(lat,lon,name);
        } else if ( tmap.type.value == NaviDestination.FAVORITE.value ) {
            return new MapPointForFavorite(lat,lon,name);
        }
    } else {
        return null;
    }
}

function stringify(obj) {
    let cache = [];
    let str = JSON.stringify(obj, function(key, value) {
      if (typeof value === "object" && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    cache = null; // reset the cache
    return str;
  }

function savePoiSFavoriteForTmap(data) {
	var items = [];
	for( key in data ) {
		items.push(data[key].item);
	}
	fn_DeviceSaveData("_POIS_FAVORITE", JSON.stringify(items));
}

function moveMylocation (mapId,lat,lon,address) {
    console.info("moveMylocation",mapId,lat,lon,address);
    if (!lat) {
      // lat = 37.566481622437934;
      // lon = 126.98502302169841;
      lat = 36.9876599;
      lon = 126.8487439;
      address = "포승읍 모아미래도2차";
    }
    maps.addMyMarker(map, new MapPoint(lat,lon,address));
    maps.setCenter(map,maps.my.getLat(),maps.my.getLon());
    maps.setZoom(map,maps.defaultZoom);

    if (typeof moveMylocationCallback !== "undefined" ) moveMylocationCallback(eval(mapId),lat,lon,address);
}
function getParam(sname) {
    var params = location.search.substr(location.search.indexOf("?") + 1);
    var sval = "";
    params = params.split("&");
    for (var i = 0; i < params.length; i++) {
        temp = params[i].split("=");
        if ([temp[0]] == sname) { sval = temp[1]; }
    }
    return sval;

}
function parsePoi(v) {
    var item = [{}];
    try {
        item = JSON.parse(v.replace("\n",""));
    } catch (e) {
    }
    return item;
}

function maxLengthCheck(object){
    if (object.value.length > object.maxLength){
        object.value = object.value.slice(0, object.maxLength);
    }
}

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1;
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

Date.prototype.hhmmss = function() {
  var hh = this.getHours();
  var mm = this.getMinutes();
  var ss = this.getSeconds();

  return [(hh>9 ? '' : '0') + hh,
          (mm>9 ? '' : '0') + mm,
          (ss>9 ? '' : '0') + ss,
         ].join('');
};

Date.prototype.yyyymmddhhmmss = function() {
  return this.yyyymmdd() + this.hhmmss();
};


var isWeb = !navigator.userAgent.includes("COMPANY=softm");
var isTest = isWeb;

// var footerNavigationUrl = ["index.html","setting.html","onoff.html","membership.html"];
var footerNavigationUrl = ["index.html","setting.html","onoff.html","membership.html","qna.html","run_option.html","developer_support.html"];
var footerNavigation = [];

function windowOpen(url) {
  // window.name = "softm";
  url = typeof fn_ResolveMapModeUrl === "function" ? fn_ResolveMapModeUrl(url) : url; // SOFTM-MAPROUTE: 새 창 URL도 지도 모드별 페이지로 변환. 2026-05-19
  window.open(window.info.serverHost +"/" + window.info.pathName + "/" + url,"softm","");
  // fn_OpenPop(window.info.serverHost+"/" + url);

}

function windowUrl(url) {
  // window.name = "softm";
  url = typeof fn_ResolveMapModeUrl === "function" ? fn_ResolveMapModeUrl(url) : url; // SOFTM-MAPROUTE: 현재 창 URL도 지도 모드별 페이지로 변환. 2026-05-19
  location.href = window.info.serverHost +"/" + window.info.pathName + "/" + url;
  // fn_OpenPop(window.info.serverHost+"/" + url);

}

function windowClose(reload) {
  try {
    window.close();
  } catch (e) {
  }
  // top.window.open('http://softm?','_self').close();
	// top.window.opener=self;
	// top.self.close();
  if ( !reload ) fn_ClosePopData();
  else fn_ClosePopData(null,"fn_Reload");
}

function windowReload(url) {
  location.href = url + "?lng="+navigator.language.split("-")[0];
}

  /**
  1 : 집↔회사
  2 : 집↔목적지
  */
  var naviModeNames = [
    ""
    , "집↔회사"
    , "집↔목적지"
    , "안전운전"
];

function getPageInfo(pageUrl) {
  var idx = Object.keys(DRAWER_LIST_INFO).findIndex(item=>item.indexOf(pageUrl.toLowerCase() + ".html")>-1);
  var drawerInfos = Object.values(DRAWER_LIST_INFO);
  var urls = Object.keys(DRAWER_LIST_INFO);
  var url = urls[idx].split("?")[0];
  var drawerInfo = drawerInfos[idx]; 
  return drawerInfo;
}

function reDrawDrawer() {
  if ( document.querySelector('.mdc-drawer') ) {
    $(".mdc-drawer .mdc-deprecated-list").empty();
    Object.entries(DRAWER_LIST_INFO).forEach((item,idx)=>{
       var pageUrl = item[0];
       var drawerInfo = item[1];
       if ( drawerInfo.visible ) {
         console.log(pageUrl);
         var row = $(".mdc-drawer .clone").clone();
         row.find("i").text(drawerInfo.icon);
         row.find(".mdc-deprecated-list-item__text").attr("data-i18n",drawerInfo.label);
         
         row.removeClass("clone mdc-deprecated-list-item--activated");
  
         var pathName = document.location.pathname;
         var pathNameInfo = pathName.split("/");
         if ( !drawerInfo.showOnlySelf ) {
           row.removeClass("none");
         }
         console.info("reDrawDrawer: " , pathNameInfo, pathNameInfo[2], ( pageUrl + (drawerInfo.pathSearchSame?document.location.search:"")))
         if ( ( pathNameInfo[2] ) === ( pageUrl + (drawerInfo.pathSearchSame?document.location.search:"") ) ) {
            // row.addClass("mdc-deprecated-list-item--activated");
            row.removeClass("none");
            row.attr("tabindex",0);
            
            // document.location.search
    
            window.drawerSelectedIndex = idx;
        }
       }
       $(".mdc-drawer .mdc-deprecated-list").append(row);

       drawer.innerList.selectedIndex = -1; // 한번 초기화화고 선택되어야 오류 없음.
       drawer.innerList.selectedIndex = window.drawerSelectedIndex;

    });
    $(".mdc-deprecated-list").i18n();
    // $(".mdc-drawer .clone").remove();
  }
}

Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
  return JSON.parse(this.getItem(key));
}

function millisecondsToTime(ms) {
  const days = Math.trunc(ms / (24 * 60 * 60 * 1000)); // 1일 = 24시간 * 60분 * 60초 * 1000ms
  ms %= (24 * 60 * 60 * 1000);
  const hours = Math.trunc(ms / (60 * 60 * 1000)); // 1시간 = 60분 * 60초 * 1000ms
  ms %= (60 * 60 * 1000);

  const minutes = Math.trunc(ms / (60 * 1000)); // 1분 = 60초 * 1000ms
  ms %= (60 * 1000);

  const seconds = Math.trunc(ms / 1000); // 1초 = 1000ms

  return {
      days,
      hours,
      minutes,
      seconds
  };
}

function initBasicInfo() {
  var v = window.info;
  if ( v ) {
    if ( v.isAding || v.isPaid ) {
      $(".user_level.link_dev_support").click(function(e) {
        fn_OpenUrl('developer_support.html');
      });

      $("#footerMenuDeveloperSupport").show();
    } else {
      $("#footerMenuDeveloperSupport").hide();
    }

    var debugBadge = false;
    if ( typeof info.isDebug !== "undefined" ) {
      if ( info.isDebug ) {
        debugBadge = true;
      }
    }
    
    $(".version-name").text("Ver."+v.versionName + " / " + v.versionCode);
    if ( v.userLevel ) {
      var user_level = t("label." + v.userLevel.toLocaleLowerCase() + "_user"); 
      try {
        $(".user_level").text(user_level + (debugBadge?"D":"") + (location.href.startsWith("file")?"F":""));
      } catch(e) {
      }
    }

    if ( info.isPaidLicense ) {
        $(".paidUser").show();
    }

    if ( info.isSubsLicense ) {
        $(".subsUser").show();
    }

    if ( info.isLifeTimeLicense ) {
        $(".lifeTimeUser").show();
    }
  } 
}
function escapeAllControlCharacters(jsonString) {
    // 모든 이스케이프 문자를 \\ 형태로 변환
    const escapedString = jsonString
        .replace(/\\/g, '\\\\')  // 백슬래시를 \\로 변환
        .replace(/\n/g, '\\n')   // 줄바꿈을 \\n으로 변환
        .replace(/\t/g, '\\t')   // 탭을 \\t으로 변환
        .replace(/\r/g, '\\r')   // 캐리지 리턴을 \\r으로 변환
        // .replace(/\b/g, '\\b')   // 백스페이스를 \\b으로 변환
        // .replace(/\f/g, '\\f')   // 폼피드를 \\f으로 변환
        // .replace(/\"/g, '\\"')   // 큰따옴표를 \\\"으로 변환
        // .replace(/'/g, "\\'");   // 작은따옴표를 \\'으로 변환

    return escapedString;
}

function safeParseJson(jsonString) {
    // JSON 문자열에서 예상치 못한 제어 문자가 있는지 검사하고 제거합니다.
    // 제어 문자가 있는 경우 이를 \\n, \\t 등으로 변환하거나 삭제합니다.

    // 제어 문자 제거 정규 표현식 (새로운 줄, 탭 등)
  var sanitizedString = (jsonString);
  // var sanitizedString = escapeAllControlCharacters(jsonString);
  //  var sanitizedString = jsonString.replace(/[\x00-\x1F\x7F]/g, '');
    
    try {
        // 파싱 시도
        const parsedObject = JSON.parse(sanitizedString);
        return parsedObject;
    } catch (error) {
        // 오류 발생 시, 오류 메시지 출력
        console.error("JSON 파싱 오류:", error);
        return null;
    }
}
