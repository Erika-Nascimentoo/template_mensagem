const axios = require('axios');

async function testAPI() {
  try {
    // Teste 0: Verificar token e app info
    console.log('=== TESTE 0: App Info ===');
    const appInfo = await axios.get(`https://graph.facebook.com/v18.0/me`, {
      headers: {
        'Authorization': `Bearer EAAWzu84ZBuG0BQlTtqQUNfb4Jq9K51AjyVI6IHrROftdE6utM2HSBHdTfUgAkiLNiyFdyMlaLL0COhBZCZC5VpRPK1Mm6iZAxFKsUrbBVcCvLRS2YGL2JVQ7oqlyZBPAF2y5PZB56A74XaBmbV3Td3FyP9aW9AjDTKSZBjw7BpyeA8sSpVjrbVmy0hrzdzM1vWeSQZDZD`
      }
    });
    console.log('✅ App Info:', appInfo.data);

    // Teste 1: Verificar Phone Number ID
    console.log('\n=== TESTE 1: Verificando Phone Number ===');
    const phoneInfo = await axios.get(`https://graph.facebook.com/v18.0/299510883248738`, {
      headers: {
        'Authorization': `Bearer EAAWzu84ZBuG0BQlTtqQUNfb4Jq9K51AjyVI6IHrROftdE6utM2HSBHdTfUgAkiLNiyFdyMlaLL0COhBZCZC5VpRPK1Mm6iZAxFKsUrbBVcCvLRS2YGL2JVQ7oqlyZBPAF2y5PZB56A74XaBmbV3Td3FyP9aW9AjDTKSZBjw7BpyeA8sSpVjrbVmy0hrzdzM1vWeSQZDZD`
      }
    });
    console.log('✅ Phone Info:', phoneInfo.data);

    // Teste 2: Listar templates disponíveis
    console.log('\n=== TESTE 2: Listando Templates ===');
    const templates = await axios.get(`https://graph.facebook.com/v18.0/299510883248738/message_templates`, {
      headers: {
        'Authorization': `Bearer EAAWzu84ZBuG0BQlTtqQUNfb4Jq9K51AjyVI6IHrROftdE6utM2HSBHdTfUgAkiLNiyFdyMlaLL0COhBZCZC5VpRPK1Mm6iZAxFKsUrbBVcCvLRS2YGL2JVQ7oqlyZBPAF2y5PZB56A74XaBmbV3Td3FyP9aW9AjDTKSZBjw7BpyeA8sSpVjrbVmy0hrzdzM1vWeSQZDZD`
      }
    });
    console.log('✅ Templates disponíveis:', templates.data);

    // Teste 3: Tentar endpoint alternativo
    console.log('\n=== TESTE 3: Endpoint Alternativo ===');
    const templates2 = await axios.get(`https://graph.facebook.com/v18.0/299510883248738?fields=message_templates`, {
      headers: {
        'Authorization': `Bearer EAAWzu84ZBuG0BQlTtqQUNfb4Jq9K51AjyVI6IHrROftdE6utM2HSBHdTfUgAkiLNiyFdyMlaLL0COhBZCZC5VpRPK1Mm6iZAxFKsUrbBVcCvLRS2YGL2JVQ7oqlyZBPAF2y5PZB56A74XaBmbV3Td3FyP9aW9AjDTKSZBjw7BpyeA8sSpVjrbVmy0hrzdzM1vWeSQZDZD`
      }
    });
    console.log('✅ Templates (alternativo):', templates2.data);

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testAPI();
