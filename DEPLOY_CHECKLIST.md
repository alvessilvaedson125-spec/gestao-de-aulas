# DEPLOY CHECKLIST OFICIAL
Bailado Carioca – Gestão de Aulas
Versão: v1.2
Status: Ativo
Regra de Ouro: Nada pode quebrar produção.

---

## 1. Verificação Inicial

- [ ] git branch confirmado
- [ ] git status limpo
- [ ] firebase use confirmado
- [ ] Ambiente staging ativo para testes

---

## 2. Fluxo de Evolução

- [ ] Deploy em staging
- [ ] Login testado
- [ ] Firestore carregando
- [ ] Relatórios corretos
- [ ] Console sem erros
- [ ] Multi-ambiente validado

---

## 3. Backup Pré-Deploy (Manual)

- [ ] Backup manual realizado via Firebase Console
- [ ] Arquivo salvo localmente
- [ ] Nomeado com data e hora
- [ ] Registro feito no commit

---

## 4. Deploy Produção

- [ ] firebase use production confirmado
- [ ] Deploy realizado
- [ ] Validação manual completa
- [ ] Tag criada