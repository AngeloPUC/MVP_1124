/*
  --------------------------------------------------------------------------------------
  Função para obter a lista existente do servidor via requisição GET
  --------------------------------------------------------------------------------------
*/
const getList = async () => {
  let url = 'http://127.0.0.1:5000/gastos';
  fetch(url, {
    method: 'get',
  })
    .then((response) => response.json())
    .then((data) => {
      data.gastos.forEach(item => insertList(item.descricao, item.data, item.classificacao, item.valor))
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
  --------------------------------------------------------------------------------------
  Chamada da função para carregamento inicial dos dados
  --------------------------------------------------------------------------------------
*/
getList()

/*
  --------------------------------------------------------------------------------------
  Função para colocar um item na lista do servidor via requisição POST
  --------------------------------------------------------------------------------------
*/
const postItem = async (inputdescricao, inputdata, inputclassificacao, inputvalor) => {
  const formData = new FormData();
  formData.append('descricao', inputdescricao);
  formData.append('data', inputdata);
  formData.append('classificacao', inputclassificacao);
  formData.append('valor', inputvalor);

  let url = 'http://127.0.0.1:5000/gasto';
  fetch(url, {
    method: 'post',
    body: formData
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
  --------------------------------------------------------------------------------------
  Função para criar um botão close para cada item da lista
  --------------------------------------------------------------------------------------
*/
const insertButton = (parent) => {
  let span = document.createElement("span");
  let txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  parent.appendChild(span);
}

/*
  --------------------------------------------------------------------------------------
  Função para remover um item da lista de acordo com o click no botão close
  --------------------------------------------------------------------------------------
*/
const removeElement = () => {
  let close = document.getElementsByClassName("close");
  let i;
  for (i = 0; i < close.length; i++) {
    close[i].onclick = function () {
      let div = this.parentElement.parentElement;
      const descricao = div.getElementsByTagName('td')[0].innerHTML;
      const data = div.getElementsByTagName('td')[1].innerHTML;
      if (confirm("Você tem certeza?")) {
        div.remove();
        deleteItem(descricao, data); // parametro duplo descricao e data para deleteItem
        alert("Removido!");
      }
    }
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para deletar um item da lista do servidor via requisição DELETE
  --------------------------------------------------------------------------------------
*/
const deleteItem = (descricao, data) => {
  console.log(`Deleting item with descricao: ${descricao} and data: ${data}`);
  let url = `http://127.0.0.1:5000/gasto?descricao=${descricao}&data=${data}`;
  fetch(url, {
    method: 'delete'
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
  --------------------------------------------------------------------------------------
  Inclui descrição, data, classificação e valor na lista
  --------------------------------------------------------------------------------------
*/
const newItem = () => {
  let inputdescricao = document.getElementById("descricao").value;
  let inputdata = document.getElementById("data").value;
  let inputclassificacao = document.getElementById("classificacao").value;
  let inputvalor = document.getElementById("valor").value;

  if (inputdescricao === '' || inputclassificacao === '' || inputdata === '') {
    alert("Descrição, classificação e data devem ser informados.");
  } else if (isNaN(inputvalor)) {
    alert("Valor precisam ser números!");
  } else {

    // Ajuste do formato da data para DD/MM
    if (inputdata) {
      const [year, month, day] = inputdata.split('-');
      const formattedDate = `${day}/${month}`;
      alert(`Data (dd/mm): ${formattedDate}`);

      // Verificar se a combinação descricao + data já existe no backend
      let urlCheck = `http://127.0.0.1:5000/gasto/existe?descricao=${encodeURIComponent(inputdescricao)}&data=${encodeURIComponent(formattedDate)}`;
      fetch(urlCheck, { method: 'get' })
        .then(response => response.json())
        .then(data => {
          if (data.exists) {
            alert("Já existe um gasto com essa descrição e data.");
          } else {
            // Continuação com a data formatada
            insertList(inputdescricao, formattedDate, inputclassificacao, inputvalor);
            postItem(inputdescricao, formattedDate, inputclassificacao, inputvalor);
            alert("Item adicionado!");
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }
}


/*
  --------------------------------------------------------------------------------------
  Função para inserir items na lista apresentada
  --------------------------------------------------------------------------------------
*/
function insertList(descricao, data, classificacao, valor) {
  var item = [descricao, data, classificacao, valor];
  var table = document.getElementById('tabela_itens');
  var row = table.insertRow();

  for (var i = 0; i < item.length; i++) {
    var cel = row.insertCell(i);
    cel.textContent = item[i];
  }
  insertButton(row.insertCell(-1));
  document.getElementById("descricao").value = "";
  document.getElementById("data").value = "";
  document.getElementById("classificacao").value = "";
  document.getElementById("valor").value = "";

  removeElement();
}

/*
  --------------------------------------------------------------------------------------
  Função para preparar o relatorio
  --------------------------------------------------------------------------------------
*/
const nome_mes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const relatorio = async () => { 
  const table = document.getElementById("tabela_itens"); 
  const rows = table.getElementsByTagName('tr'); 

  // Coletar e agrupar dados localmente
  let reportData = {}; 
  for (let i = 1; i < rows.length; i++) { 
    // Começa de 1 para ignorar a linha de cabeçalho 
    const cells = rows[i].getElementsByTagName('td'); 
    const descricao = cells[0].innerText; 
    const date = cells[1].innerText; 
    const classificacao = cells[2].innerText; 
    const valor = parseFloat(cells[3].innerText); 
    const comentario = cells[4]?.innerText || ""; 

    const [day, month] = date.split('/'); 

    if (!reportData[month]) { 
      reportData[month] = {}; 
    } 
    if (!reportData[month][classificacao]) {
      reportData[month][classificacao] = { 
        items: [], 
        total: 0 
      }; 
    } 

    reportData[month][classificacao].items.push({ descricao, day, valor, comentario }); // Inclui o comentário do gasto
    reportData[month][classificacao].total += valor; 
  } 

  // Gerar a nova página HTML 
  let reportWindow = window.open("", "ReportWindow"); 
  reportWindow.document.write(` 
    <!DOCTYPE html> 
      <html> 
        <head> 
          <title>Relatório</title> 
          <link rel="stylesheet" type="text/css" href="relatorio.css">
          <style>
            textarea {
              width: 100%;
              height: 20px; /* Reduz a altura do campo de comentários */
              resize: none;
              pointer-events: none; /* Desabilita a interação direta */
            }
            button {
              margin: 5px;
            }
          </style>
        </head> 
        <body> 
          <h1>Relatório de Dados Classificados</h1>
      <html>    
  `);

  // Ordenar os meses para exibição no relatório 
  Object.keys(reportData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(month => {
    // Converter número do mês para nome do mês
    const mes = nome_mes[parseInt(month) - 1]; 

    reportWindow.document.write(`<h2>Mês: ${mes}</h2>`); 
    for (let classificacao in reportData[month]) { 
      reportWindow.document.write(`<h3>Classificação: ${classificacao}</h3>`); 
      reportWindow.document.write("<table border='1'><tr><th>Descrição</th><th>Dia</th><th>Valor</th><th>Comentário</th><th>Ações</th></tr>"); // Adiciona a coluna de comentário e ações
      reportData[month][classificacao].items.sort((a, b) => a.day - b.day).forEach(item => { 
        reportWindow.document.write(`<tr>
          <td>${item.descricao}</td>
          <td>${item.day}</td>
          <td>${item.valor.toFixed(2)}</td>
          <td><textarea>${item.comentario}</textarea></td>
          <td>
            <button onclick="addComment(this)">Inserir</button>
            <button onclick="deleteComment(this)">Apagar</button>
          </td>
        </tr>`); // Adiciona o comentário e botões na linha
      }); 
      
      reportWindow.document.write(`<tr><td colspan="2"><strong>Total</strong></td><td><strong>${reportData[month][classificacao].total.toFixed(2)}</strong></td><td colspan="2"></td></tr>`); // Atualiza para colunas, total alinhado corretamente
      reportWindow.document.write("</table>"); 
    }  
  });

  reportWindow.document.write(`
    <script>

  // Função para adicionar um comentário
  const addComment = (button) => {
    const row = button.parentElement.parentElement;
    const commentCell = row.getElementsByTagName('textarea')[0];
    commentCell.style.pointerEvents = "auto"; // Habilita a interação
    const comment = prompt("Digite seu comentário:", commentCell.value);
    if (comment !== null && comment.trim() !== "") { // Verifica se o comentário não é vazio
      commentCell.value = comment;
    }
    commentCell.style.pointerEvents = "none"; // Desabilita a interação novamente
  };

  // Função para apagar um comentário
  const deleteComment = (button) => {
    const row = button.parentElement.parentElement;
    const commentCell = row.getElementsByTagName('textarea')[0];
    commentCell.style.pointerEvents = "auto"; // Habilita a interação
    commentCell.value = ""; // Limpa o comentário da textarea
    commentCell.style.pointerEvents = "none"; // Desabilita a interação novamente
  };

    </script>
  `);
  reportWindow.document.write("</body></html>"); 
  reportWindow.document.close(); 
};
