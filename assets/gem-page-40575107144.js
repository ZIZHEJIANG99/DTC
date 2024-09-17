

    
  
        jQuery(function() {
            try {
                var $module = jQuery('#m-1559311283625').children('.module');
                var single   = $module.attr('data-single');
                var openDefault  = $module.attr('data-openDefault');
                var openTab  = $module.attr('data-openTab');
                var mode     = jQuery('.gryffeditor').hasClass('editing') ? 'dev' : 'production';
    
                if(openDefault == 0 || openDefault == '0') {
                    openTab = '0';
                }
    
                $module.gfAccordion({
                    single: single,
                    openTab: openTab,
                    mode: mode
                });
    
                var borderColor = $module.attr('data-borderColor');
                var borderSize = $module.attr('data-borderSize');
    
                $module.children('[data-accordion]').children('[data-control]').css('border-bottom', borderSize + ' solid ' + borderColor);
                $module.children('[data-accordion]').children('[data-content]').children().css('border-bottom', borderSize + ' solid ' + borderColor);
                
            } catch(err) {}
        });
    