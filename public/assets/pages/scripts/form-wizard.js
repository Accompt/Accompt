var FormWizard = (function () {
  return {
        // main function to initiate the module
    init: function () {
      if (!jQuery().bootstrapWizard) {
        return
      }

      var handleTitle = function (tab, navigation, index) {
        var total = navigation.find('li').length
        var current = index + 1
                // set wizard title
        $('.step-title', $('#form_wizard_1')).text('Step ' + (index + 1) + ' of ' + total)
                // set done steps
        jQuery('li', $('#form_wizard_1')).removeClass('done')
        var li_list = navigation.find('li')
        for (var i = 0; i < index; i++) {
          jQuery(li_list[i]).addClass('done')
        }

        if (current == 1) {
          $('#form_wizard_1').find('.button-previous').hide()
          $('#form_wizard_1').find('.button-next').text('CONTINUE')
        } else {
          $('#form_wizard_1').find('.button-previous').show()
          $('#form_wizard_1').find('.button-next').text('NEXT')
        }

        if (current >= total) {
          // $('#form_wizard_1').find('.button-previous').hide()
          $('#form_wizard_1').find('.button-next').hide()
        } else {
          $('#form_wizard_1').find('.button-next').show()
        }
        App.scrollTo($('.page-title'))
      }

            // default form wizard
      $('#form_wizard_1').bootstrapWizard({
        'nextSelector': '.button-next',
        'previousSelector': '.button-previous',
        onTabClick: function (tab, navigation, index, clickedIndex) {
          return false
        },
        onNext: function (tab, navigation, index) {
          if (stepValidation()) {
            formNumber++
            handleTitle(tab, navigation, index)
          } else {
            return false;
          }
        },
        onPrevious: function (tab, navigation, index) {
          formNumber--
          handleTitle(tab, navigation, index)
        },
        onTabShow: function (tab, navigation, index) {
          var total = navigation.find('li').length
          var current = index + 1
          var $percent = (current / total) * 100
          $('#form_wizard_1').find('.progress-bar').css({
            width: $percent + '%'
          })
        }
      })

      $('#form_wizard_1').find('.button-previous').hide()
    }

  }
}())

jQuery(document).ready(function () {
  FormWizard.init()
})
