const db = require('../services/dbService.js');
const UserInputError = require('../errors/userInputError.js');

module.exports = {
  defineTemplateToUse: async (input) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.user.templates && output.user.templates.length === 1) {
      output.template = output.user.templates[0];
    }
    return output;
  },
  defineTemplateName: async (input) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.query_params && output.query_params.template_name){
      output.templateName = output.query_params.template_name;
    } else {
      output.templateName = output.message.text;
    }
    if (!output.user.templates) {
      output.user.templates = [];
    }
    return output;
  },
  defineTemplateFromState: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    const { templateName } = output.user.state;
    if (!templateName) {
      throw new UserInputError(message);
    }
    output.template = output.user.templates.find(t => t.name === templateName);
    if (!output.template) {
      throw new UserInputError(message);
    }
    return output;
  },
  ifTemplateNameBusy: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.user.templates.find(l => l.name === output.templateName)) {
      throw new UserInputError(message);
    }
    return output;
  },
  ifNoTemplates: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!output.user.templates || !output.user.templates.length) {
      throw new UserInputError(message);
    }
    return output;
  }
}
