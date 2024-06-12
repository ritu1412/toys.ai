from transformers import AutoTokenizer, AutoModelForCausalLM,pipeline
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.schema.runnable import RunnablePassthrough
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain import HuggingFacePipeline
from langchain.chains import LLMChain
from dotenv import load_dotenv


from datasets import Dataset 
import os
from ragas import evaluate
from ragas.metrics import answer_correctness,context_precision,context_recall,context_relevancy,faithfulness

import gradio as gr
import chromadb
import argparse
import torch
import os

load_dotenv()

hf_token = os.getenv("HF_READ_TOKEN")
openai_token = os.getenv("OPENAI_TOKEN")

def get_model_tokenizer(model_name ='mistralai/Mistral-7B-Instruct-v0.2' ):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True,token=hf_token)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    model = AutoModelForCausalLM.from_pretrained(
        model_name,token = hf_token,trust_remote_code=True)
    model.to(device)

    text_generation_pipeline = pipeline(
        model=model,
        tokenizer=tokenizer,
        task="text-generation",
        temperature=0.2,
        repetition_penalty=1.1,
        return_full_text=True,
        max_new_tokens=1000,
        pad_token_id=tokenizer.eos_token_id,
        token = hf_token
    )

    llm = HuggingFacePipeline(pipeline=text_generation_pipeline)

    return llm,tokenizer



def get_conversational_chain(llm,langchain_chroma):
    prompt_template = """
    ### [INST] Instruction: Answer the question based on your knowledge. Here is context to help:

    {context}

    ### QUESTION:
    {question} [/INST]
    """

    # Create prompt from prompt template
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template=prompt_template,
    )

    # Create llm chain
    llm_chain = LLMChain(llm=llm, prompt=prompt)

    rag_chain = (
    {"context": langchain_chroma.as_retriever(), "question": RunnablePassthrough()}
        | llm_chain
    )
    return rag_chain



def ECE_chatbot(question,chain):
  bot_message = "Default message"
  bot_message = chain.invoke(question)['text']
  index = bot_message.find('[/INST]')
  return bot_message[index+9:]

def main():
    os.environ["OPENAI_API_KEY"] = openai_token
    parser = argparse.ArgumentParser()
    parser.add_argument('MODEL',type=str,help='model you wish to evaluate')
    parser.add_argument('GT_DATASET',type=str,help='dict containing questions and ground truth')
    parser.add_argument('FILE_PATH',nargs='?',type=str,default=None,help='path to store the evaluation results')
    args = parser.parse_args()
    questions = args.GT_DATASET['question']
    ground_truth = args.GT_DATASET['answer']
    model = args.MODEL
    file_path = args.FILE_PATH

    llm,tokenizer = get_model_tokenizer(model)

    # get the vectorstore
    client = chromadb.PersistentClient(path="DB/")
    embeddings = OpenAIEmbeddings(openai_api_key=openai_token)
    langchain_chroma = Chroma(client=client,collection_name='ece_bot',
                        embedding_function=embeddings)
    conversational_chain = get_conversational_chain(llm,langchain_chroma)

    answers = [ECE_chatbot(question) for question in questions] 
    contexts = [[langchain_chroma.similarity_search(query=question, k=2)[0].page_content] for question in questions]

    data_samples = {
        'question': questions,
        'answer': answers,
        'contexts': contexts,
        'ground_truth':ground_truth
    }

    dataset = Dataset.from_dict(data_samples)

    score = evaluate(dataset,metrics=[answer_correctness,context_precision,context_recall,context_relevancy,faithfulness])
    score.to_pandas()
    if file_path is not None:
        score.to_csv(file_path)

    return score

