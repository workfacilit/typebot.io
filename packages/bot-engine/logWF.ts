export async function sendLogRequest(tipo: string, data: any): Promise<any> {
  const dataRequest = {
    tipo,
    data,
  }

  return await fetch(
    'https://wfv2-dev07.workfacilit.com/app/prod/api/demandas/inserir-log',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Atend-Token': 'WF',
        Authorization:
          'Basic ODM1VFJHREhTNjNVSEY4NDdISERKM1U3OjI3NjRIRkpTS1M4NTZSSk1KRDg3M1lFTUQ3',
      },
      body: JSON.stringify(dataRequest),
    }
  )
}
